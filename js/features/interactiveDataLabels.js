export const interactiveDataLabelsPlugin = {
  id: "interactiveDataLabels",

  beforeInit(chart) {
    const rawSignature =
      chart.config.type +
      "_" +
      JSON.stringify(chart.data.labels) +
      "_" +
      chart.data.datasets.map((d) => d.label).join("_");

    let hash = 0;
    for (let i = 0; i < rawSignature.length; i++) {
      hash = (hash << 5) - hash + rawSignature.charCodeAt(i);
      hash |= 0;
    }
    chart.customSignature = "valor_labels_" + hash;

    const savedState = localStorage.getItem(chart.customSignature);
    chart.customBoxPositions = {};

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (Array.isArray(parsed)) {
          chart.customLabelState = new Set(parsed);
        } else {
          chart.customLabelState = new Set(parsed.active || []);
          chart.customBoxPositions = parsed.positions || {};
        }
      } catch (e) {
        chart.customLabelState = new Set();
      }
    } else {
      chart.customLabelState = new Set();
    }

    chart.customButtonHitboxes = [];
    chart.customBoxHitboxes = {};
    chart.dragState = null;
    chart.customIsPrinting = false;

    chart._beforePrintHandler = () => {
      chart.customIsPrinting = true;
      chart.render();
    };
    chart._afterPrintHandler = () => {
      chart.customIsPrinting = false;
      chart.render();
    };
    window.addEventListener("beforeprint", chart._beforePrintHandler);
    window.addEventListener("afterprint", chart._afterPrintHandler);

    const canvas = chart.canvas;

    chart._handleDragStart = (e) => {
      if (chart.customIsPrinting) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const [entityIndex, box] of Object.entries(
        chart.customBoxHitboxes,
      )) {
        if (
          mouseX >= box.left &&
          mouseX <= box.right &&
          mouseY >= box.top &&
          mouseY <= box.bottom
        ) {
          chart.dragState = {
            entityIndex: entityIndex,
            offsetX: mouseX - box.left,
            offsetY: mouseY - box.top,
          };
          canvas.style.cursor = "grabbing";
          break;
        }
      }
    };

    chart._handleDragMove = (e) => {
      if (chart.dragState && !chart.customIsPrinting) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const boxX = mouseX - chart.dragState.offsetX;
        const boxY = mouseY - chart.dragState.offsetY;

        // NOUVEAU : On récupère l'ancre (la barre) pour stocker une position relative
        const boxHitbox = chart.customBoxHitboxes[chart.dragState.entityIndex];
        if (boxHitbox) {
          chart.customBoxPositions[chart.dragState.entityIndex] = {
            dx: boxX - boxHitbox.anchorX,
            dy: boxY - boxHitbox.anchorY,
          };
          chart.render();
        }
      } else if (!chart.customIsPrinting) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let isHovering = false;
        for (const box of Object.values(chart.customBoxHitboxes)) {
          if (
            mouseX >= box.left &&
            mouseX <= box.right &&
            mouseY >= box.top &&
            mouseY <= box.bottom
          ) {
            isHovering = true;
            break;
          }
        }
        canvas.style.cursor = isHovering ? "grab" : "default";
      }
    };

    chart._handleDragEnd = () => {
      if (chart.dragState) {
        chart.dragState = null;
        canvas.style.cursor = "default";

        const saveObj = {
          active: Array.from(chart.customLabelState),
          positions: chart.customBoxPositions,
        };
        localStorage.setItem(chart.customSignature, JSON.stringify(saveObj));
      }
    };

    canvas.addEventListener("mousedown", chart._handleDragStart);
    window.addEventListener("mousemove", chart._handleDragMove);
    window.addEventListener("mouseup", chart._handleDragEnd);
  },

  destroy(chart) {
    window.removeEventListener("beforeprint", chart._beforePrintHandler);
    window.removeEventListener("afterprint", chart._afterPrintHandler);
    chart.canvas.removeEventListener("mousedown", chart._handleDragStart);
    window.removeEventListener("mousemove", chart._handleDragMove);
    window.removeEventListener("mouseup", chart._handleDragEnd);
  },

  afterDatasetsDraw(chart, args, pluginOptions) {
    const { ctx, width, height } = chart;
    chart.customButtonHitboxes = [];
    chart.customBoxHitboxes = {};

    const activeEntities = new Set();
    const obstacles = [];
    const drawnBoxes = [];

    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, i) => {
        const dataVal = dataset.data[i];
        if (dataVal === null || dataVal === undefined) return;

        const pos = element.tooltipPosition();
        let { x, y } = pos;
        if (chart.config.type === "bar") y -= 12;

        const key = `${dsIndex}-${i}`;
        const isToggled = chart.customLabelState.has(key);
        const radius = 8;

        if (chart.config.type === "bar") {
          const barWidth = element.width || 15;
          const barTop = Math.min(element.y, element.base);
          const barBottom = Math.max(element.y, element.base);
          obstacles.push({
            left: element.x - barWidth / 2,
            right: element.x + barWidth / 2,
            top: barTop - 15,
            bottom: barBottom,
          });
        } else {
          obstacles.push({
            left: pos.x - radius - 5,
            right: pos.x + radius + 5,
            top: pos.y - radius - 5,
            bottom: pos.y + radius + 5,
          });
        }

        if (!chart.customIsPrinting) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = isToggled ? "#000091" : "#f6f6f6";
          ctx.fill();
          ctx.strokeStyle = "#000091";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = isToggled ? "#ffffff" : "#000091";
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(isToggled ? "-" : "+", x, y + 1);
          ctx.restore();

          chart.customButtonHitboxes.push({ x, y, r: radius, key });
        }

        if (isToggled) activeEntities.add(i);
      });
    });

    activeEntities.forEach((i) => {
      ctx.save();
      let entityRaw = chart.data.labels[i];
      const entityName = Array.isArray(entityRaw)
        ? entityRaw.join(" ")
        : String(entityRaw);

      const tableData = [];
      let groupX = 0,
        groupY = Infinity,
        count = 0;

      chart.data.datasets.forEach((ds, idx) => {
        if (!chart.getDatasetMeta(idx).hidden) {
          const val = ds.data[i];
          if (val !== null && val !== undefined) {
            const formattedVal =
              typeof val === "number"
                ? Number.isInteger(val)
                  ? val.toLocaleString("fr-FR")
                  : val.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
                : val;

            tableData.push({
              label: ds.label || "Valeur",
              value: String(formattedVal),
            });

            const el = chart.getDatasetMeta(idx).data[i];
            const pos = el.tooltipPosition();
            groupX += pos.x;
            groupY = Math.min(
              groupY,
              chart.config.type === "bar" ? pos.y - 12 : pos.y,
            );
            count++;
          }
        }
      });

      if (count > 0) groupX /= count;

      ctx.font = 'bold 13px "Marianne", arial, sans-serif';
      const titleWidth = ctx.measureText(entityName).width;
      let maxLabelWidth = 0,
        maxValWidth = 0;

      tableData.forEach((row) => {
        ctx.font = 'normal 12px "Marianne", arial, sans-serif';
        const lw = ctx.measureText(row.label).width;
        ctx.font = 'bold 12px "Marianne", arial, sans-serif';
        const vw = ctx.measureText(row.value).width;
        if (lw > maxLabelWidth) maxLabelWidth = lw;
        if (vw > maxValWidth) maxValWidth = vw;
      });

      const padding = 10,
        gap = 20,
        rowHeight = 16;
      const tableWidth = maxLabelWidth + gap + maxValWidth;
      const boxWidth = Math.max(titleWidth, tableWidth) + padding * 2;
      const boxHeight = padding * 2 + 16 + 12 + tableData.length * rowHeight;

      let boxX, boxY;
      let offsetVertical = chart.customIsPrinting ? 2 : 18;

      if (chart.customBoxPositions[i]) {
        // NOUVEAU : Application de la position relative (Responsive & PDF friendly)
        if (chart.customBoxPositions[i].dx !== undefined) {
          boxX = groupX + chart.customBoxPositions[i].dx;
          boxY = groupY + chart.customBoxPositions[i].dy;
        } else {
          // Fallback pour les anciennes sauvegardes
          boxX = chart.customBoxPositions[i].x;
          boxY = chart.customBoxPositions[i].y;
        }

        // Garde-fous pour ne pas sortir de l'écran ou de la feuille PDF
        if (boxX < 0) boxX = 0;
        else if (boxX + boxWidth > width) boxX = width - boxWidth;
        if (boxY < 0) boxY = 0;
        else if (boxY + boxHeight > height) boxY = height - boxHeight;
      } else {
        const getOverlapScore = (bx, by) => {
          let score = 0;
          if (
            bx < 5 ||
            by < 5 ||
            bx + boxWidth > width - 5 ||
            by + boxHeight > height - 5
          )
            return Infinity;
          const bLeft = bx - 2,
            bRight = bx + boxWidth + 2,
            bTop = by - 2,
            bBottom = by + boxHeight + 2;
          for (const obs of drawnBoxes) {
            if (
              bLeft < obs.right &&
              bRight > obs.left &&
              bTop < obs.bottom &&
              bBottom > obs.top
            )
              return Infinity;
          }
          for (const obs of obstacles) {
            if (
              bLeft < obs.right &&
              bRight > obs.left &&
              bTop < obs.bottom &&
              bBottom > obs.top
            )
              score += 10;
          }
          return score;
        };

        const candidates = [];
        candidates.push({
          x: groupX - boxWidth / 2,
          y: groupY - offsetVertical - boxHeight,
        });
        candidates.push({
          x: groupX - boxWidth / 2,
          y: groupY + offsetVertical + 20,
        });

        const step = 15;
        for (let j = 1; j <= 20; j++) {
          let shift = j * step;
          candidates.push({
            x: groupX - boxWidth / 2 + shift,
            y: groupY - offsetVertical - boxHeight,
          });
          candidates.push({
            x: groupX - boxWidth / 2 - shift,
            y: groupY - offsetVertical - boxHeight,
          });
          candidates.push({
            x: groupX - boxWidth / 2 + shift,
            y: groupY + offsetVertical + 20,
          });
          candidates.push({
            x: groupX - boxWidth / 2 - shift,
            y: groupY + offsetVertical + 20,
          });
          candidates.push({
            x: groupX + 20 + shift,
            y: groupY - boxHeight / 2,
          });
          candidates.push({
            x: groupX - boxWidth - 20 - shift,
            y: groupY - boxHeight / 2,
          });
          candidates.push({
            x: groupX + 20,
            y: groupY - boxHeight / 2 + shift,
          });
          candidates.push({
            x: groupX + 20,
            y: groupY - boxHeight / 2 - shift,
          });
          candidates.push({
            x: groupX - boxWidth - 20,
            y: groupY - boxHeight / 2 + shift,
          });
          candidates.push({
            x: groupX - boxWidth - 20,
            y: groupY - boxHeight / 2 - shift,
          });
        }

        let bestPos = candidates[0],
          minScore = Infinity;
        for (const pos of candidates) {
          const score = getOverlapScore(pos.x, pos.y);
          if (score === 0) {
            bestPos = pos;
            minScore = 0;
            break;
          }
          if (score < minScore) {
            minScore = score;
            bestPos = pos;
          }
        }

        boxX = bestPos.x;
        boxY = bestPos.y;
      }

      // NOUVEAU : On enregistre aussi l'ancre (groupX/groupY) pour la logique de drag relative
      chart.customBoxHitboxes[i] = {
        left: boxX,
        right: boxX + boxWidth,
        top: boxY,
        bottom: boxY + boxHeight,
        anchorX: groupX,
        anchorY: groupY,
      };
      drawnBoxes.push({
        left: boxX,
        right: boxX + boxWidth,
        top: boxY,
        bottom: boxY + boxHeight,
      });

      const idealX = groupX - boxWidth / 2;
      const idealY = groupY - offsetVertical - boxHeight;
      if (Math.abs(boxX - idealX) > 10 || Math.abs(boxY - idealY) > 10) {
        ctx.beginPath();
        ctx.moveTo(groupX, groupY);
        let anchorX = boxX + boxWidth / 2;
        let anchorY = boxY > groupY ? boxY : boxY + boxHeight;
        if (boxX > groupX) anchorX = boxX;
        else if (boxX + boxWidth < groupX) anchorX = boxX + boxWidth;

        ctx.lineTo(anchorX, anchorY);
        ctx.strokeStyle = "#000091";
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
      else ctx.rect(boxX, boxY, boxWidth, boxHeight);
      ctx.fill();
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textBaseline = "top";
      let currentY = boxY + padding;

      ctx.fillStyle = "#000091";
      ctx.font = 'bold 13px "Marianne", arial, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(entityName, boxX + boxWidth / 2, currentY);

      currentY += 16;

      ctx.beginPath();
      ctx.moveTo(boxX + padding, currentY + 4);
      ctx.lineTo(boxX + boxWidth - padding, currentY + 4);
      ctx.strokeStyle = "#eeeeee";
      ctx.stroke();
      currentY += 12;

      tableData.forEach((row) => {
        ctx.fillStyle = "#1e1e1e";
        ctx.font = 'normal 12px "Marianne", arial, sans-serif';
        ctx.textAlign = "left";
        ctx.fillText(row.label, boxX + padding, currentY);

        ctx.font = 'bold 12px "Marianne", arial, sans-serif';
        ctx.textAlign = "right";
        ctx.fillText(row.value, boxX + boxWidth - padding, currentY);

        currentY += rowHeight;
      });
      ctx.restore();
    });
  },

  afterEvent(chart, args) {
    if (chart.customIsPrinting || chart.dragState) return;

    const event = args.event;
    if (event.type === "click") {
      const clickX = event.x;
      const clickY = event.y;
      let clickedOnButton = false;

      for (const hitbox of chart.customButtonHitboxes) {
        const distanceX = clickX - hitbox.x;
        const distanceY = clickY - hitbox.y;
        const distance = Math.sqrt(
          distanceX * distanceX + distanceY * distanceY,
        );

        if (distance <= hitbox.r + 3) {
          if (chart.customLabelState.has(hitbox.key)) {
            chart.customLabelState.delete(hitbox.key);
            const entityIndex = hitbox.key.split("-")[1];
            delete chart.customBoxPositions[entityIndex];
          } else {
            chart.customLabelState.add(hitbox.key);
          }
          clickedOnButton = true;
          break;
        }
      }

      if (clickedOnButton) {
        const saveObj = {
          active: Array.from(chart.customLabelState),
          positions: chart.customBoxPositions,
        };
        localStorage.setItem(chart.customSignature, JSON.stringify(saveObj));
        args.changed = true;
      }
    }
  },
};
