function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampRange(minimum, span, bounds) {
  const boundedMinimum = clamp(minimum, bounds.min, bounds.max - span);
  return { min: boundedMinimum, max: boundedMinimum + span };
}

export function calculatePinchView({
  initialView,
  initialMidpoint,
  currentMidpoint,
  initialDistance,
  currentDistance,
  plot,
  bounds,
  minimumSpan,
}) {
  if (
    !Number.isFinite(initialDistance) ||
    !Number.isFinite(currentDistance) ||
    initialDistance <= 0 ||
    currentDistance <= 0
  ) {
    return initialView;
  }

  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const factor = initialDistance / currentDistance;
  const initialXSpan = initialView.xMax - initialView.xMin;
  const initialYSpan = initialView.yMax - initialView.yMin;
  const xSpan = clamp(
    initialXSpan * factor,
    minimumSpan.x,
    bounds.xMax - bounds.xMin,
  );
  const ySpan = clamp(
    initialYSpan * factor,
    minimumSpan.y,
    bounds.yMax - bounds.yMin,
  );

  const initialXRatio = (initialMidpoint.x - plot.left) / plotWidth;
  const currentXRatio = (currentMidpoint.x - plot.left) / plotWidth;
  const initialYRatio = (plot.bottom - initialMidpoint.y) / plotHeight;
  const currentYRatio = (plot.bottom - currentMidpoint.y) / plotHeight;
  const anchorX = initialView.xMin + initialXRatio * initialXSpan;
  const anchorY = initialView.yMin + initialYRatio * initialYSpan;
  const xRange = clampRange(anchorX - currentXRatio * xSpan, xSpan, {
    min: bounds.xMin,
    max: bounds.xMax,
  });
  const yRange = clampRange(anchorY - currentYRatio * ySpan, ySpan, {
    min: bounds.yMin,
    max: bounds.yMax,
  });

  return {
    xMin: xRange.min,
    xMax: xRange.max,
    yMin: yRange.min,
    yMax: yRange.max,
  };
}
