// Adapted from OlchiScope App.jsx. See provenance.json.
import {useEffect,useRef,useState} from 'react';
import {calculatePinchView} from './viewport.js';
const ZOOM_DRAG_THRESHOLD=8;
function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function makeTicks(minimum, maximum, count) {
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return minimum + (maximum - minimum) * ratio;
  });
}

function formatNumber(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function tickDigits(span) {
  if (span < 1) return 2;
  if (span < 5) return 1;
  return 0;
}

export function Graph({
  bounds, minimumSpan, formatX, formatY, yLabel,
  data,
  view,
  tool,
  mode,
  markers,
  onToggleMarker,
  onMoveMarker,
  onPan,
  onZoomAt,
  onZoomTo,
  onPinch,
  analysisRange,
  onAnalysisRange,
}) {
  const svgRef = useRef(null);
  const [VIEWBOX,setViewBox]=useState({width:1200,height:520});
  const PLOT={left:64,right:Math.max(100,VIEWBOX.width-20),top:38,bottom:Math.max(58,VIEWBOX.height-40)};
  useEffect(()=>{
    const svg=svgRef.current;if(!svg)return;
    const observer=new ResizeObserver(([entry])=>{
      const width=Math.round(entry.contentRect.width),height=Math.round(entry.contentRect.height);
      if(width>0&&height>0)setViewBox(old=>old.width===width&&old.height===height?old:{width,height});
    });
    observer.observe(svg);return()=>observer.disconnect();
  },[]);
  const gestureRef = useRef(null);
  const activeTouchPointersRef = useRef(new Map());
  const suppressClickRef = useRef(false);
  const [hovered, setHovered] = useState(null);
  const [zoomSelection, setZoomSelection] = useState(null);
  const [analysisSelection, setAnalysisSelection] = useState(null);
  const [selectedMarkerPosition, setSelectedMarkerPosition] = useState(null);
  const [movingMarkerPosition, setMovingMarkerPosition] = useState(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setSelectedMarkerPosition(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (selectedMarkerPosition !== null && selectedMarkerPosition >= markers.length) {
      setSelectedMarkerPosition(null);
    }
  }, [markers.length, selectedMarkerPosition]);

  const xScale = (time) =>
    PLOT.left +
    ((time - view.xMin) / (view.xMax - view.xMin)) * (PLOT.right - PLOT.left);
  const yScale = (value) =>
    PLOT.bottom -
    ((value - view.yMin) / (view.yMax - view.yMin)) * (PLOT.bottom - PLOT.top);

  const visibleData = data.filter(
    (point) => point.x >= view.xMin && point.x <= view.xMax,
  );
  const linePoints = visibleData
    .map((point) => `${xScale(point.x)},${yScale(point.value)}`)
    .join(" ");
  const areaPoints = linePoints
    ? `${xScale(visibleData[0].x)},${PLOT.bottom} ${linePoints} ${xScale(
        visibleData[visibleData.length - 1].x,
      )},${PLOT.bottom}`
    : "";

  const eventToSvgPoint = (event) => {
    const svg = svgRef.current;
    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) return { x: PLOT.left, y: PLOT.top };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(screenMatrix.inverse());
    return { x: local.x, y: local.y };
  };

  const clampToPlot = (point) => ({
    x: clamp(point.x, PLOT.left, PLOT.right),
    y: clamp(point.y, PLOT.top, PLOT.bottom),
  });

  const svgPointToValue = (point) => ({
    x:
      view.xMin +
      ((point.x - PLOT.left) / (PLOT.right - PLOT.left)) *
        (view.xMax - view.xMin),
    value:
      view.yMin +
      ((PLOT.bottom - point.y) / (PLOT.bottom - PLOT.top)) *
        (view.yMax - view.yMin),
  });

  const nearestPoint = (x) => {
    if (!visibleData.length) return null;
    const time =
      view.xMin + ((x - PLOT.left) / (PLOT.right - PLOT.left)) * (view.xMax - view.xMin);
    const nearest = visibleData.reduce((candidate, point) =>
      Math.abs(point.x - time) < Math.abs(candidate.x - time) ? point : candidate,
    );
    return nearest.value >= view.yMin && nearest.value <= view.yMax
      ? nearest
      : null;
  };

  const nearestMovablePoint = (x, markerPosition) => {
    const unavailable = new Set(
      markers.filter((_, position) => position !== markerPosition),
    );
    const candidates = visibleData.filter(
      (point) =>
        !unavailable.has(point.index) &&
        point.value >= view.yMin &&
        point.value <= view.yMax,
    );
    if (!candidates.length) return null;
    const time =
      view.xMin + ((x - PLOT.left) / (PLOT.right - PLOT.left)) * (view.xMax - view.xMin);
    return candidates.reduce((candidate, point) =>
      Math.abs(point.x - time) < Math.abs(candidate.x - time) ? point : candidate,
    );
  };

  const pointerPair = () => Array.from(activeTouchPointersRef.current.values()).slice(0, 2);

  const midpoint = ([first, second]) => ({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  });

  const pointerDistance = ([first, second]) =>
    Math.hypot(second.x - first.x, second.y - first.y);

  const clearTransientGesture = () => {
    setZoomSelection(null);
    setAnalysisSelection(null);
    setMovingMarkerPosition(null);
    setHovered(null);
  };

  const releasePointer = (pointerId) => {
    try {
      if (svgRef.current.hasPointerCapture(pointerId)) {
        svgRef.current.releasePointerCapture(pointerId);
      }
    } catch {
      // Synthetic browser checks may not own a native pointer capture.
    }
  };

  const handlePointerMove = (event) => {
    const pointer = eventToSvgPoint(event);
    if (event.pointerType === "touch" && activeTouchPointersRef.current.has(event.pointerId)) {
      activeTouchPointersRef.current.set(event.pointerId, pointer);
    }
    if (gestureRef.current?.type === "pinch") {
      const pointers = pointerPair();
      if (pointers.length === 2) {
        onPinch(
          calculatePinchView({
            initialView: gestureRef.current.initialView,
            initialMidpoint: gestureRef.current.initialMidpoint,
            currentMidpoint: midpoint(pointers),
            initialDistance: gestureRef.current.initialDistance,
            currentDistance: pointerDistance(pointers),
            plot: PLOT,
            bounds: {
              xMin: bounds.xMin,
              xMax: bounds.xMax,
              yMin: bounds.yMin,
              yMax: bounds.yMax,
            },
            minimumSpan: minimumSpan,
          }),
        );
      }
      return;
    }
    if (gestureRef.current?.type === "pan") {
      const deltaX = pointer.x - gestureRef.current.point.x;
      onPan((-deltaX / (PLOT.right - PLOT.left)) * (view.xMax - view.xMin));
      gestureRef.current = { type: "pan", point: pointer };
      return;
    }
    if (gestureRef.current?.type === "zoom") {
      const current = clampToPlot(pointer);
      gestureRef.current = { ...gestureRef.current, current };
      setZoomSelection({ start: gestureRef.current.start, current });
      setHovered(null);
      return;
    }
    if (gestureRef.current?.type === "zoom-out") {
      gestureRef.current = {
        ...gestureRef.current,
        current: clampToPlot(pointer),
      };
      setHovered(null);
      return;
    }
    if (gestureRef.current?.type === "analysis") {
      const current = clampToPlot(pointer);
      gestureRef.current = { ...gestureRef.current, current };
      setAnalysisSelection({ start: gestureRef.current.start, current });
      setHovered(null);
      return;
    }
    if (gestureRef.current?.type === "move-marker") {
      const current = clampToPlot(pointer);
      const distance = Math.hypot(
        current.x - gestureRef.current.start.x,
        current.y - gestureRef.current.start.y,
      );
      if (!gestureRef.current.hasMoved && distance < ZOOM_DRAG_THRESHOLD) {
        return;
      }
      const point = nearestMovablePoint(
        current.x - gestureRef.current.pointerOffsetX,
        gestureRef.current.markerPosition,
      );
      if (point && point.index !== gestureRef.current.currentIndex) {
        onMoveMarker(gestureRef.current.markerPosition, point.index);
        gestureRef.current = {
          ...gestureRef.current,
          currentIndex: point.index,
          hasMoved: true,
        };
      } else if (!gestureRef.current.hasMoved) {
        gestureRef.current = { ...gestureRef.current, hasMoved: true };
      }
      setHovered(null);
      return;
    }
    if (
      pointer.x < PLOT.left ||
      pointer.x > PLOT.right ||
      pointer.y < PLOT.top ||
      pointer.y > PLOT.bottom
    ) {
      setHovered(null);
      return;
    }
    setHovered(nearestPoint(pointer.x));
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    const pointer = eventToSvgPoint(event);
    const isInsidePlot =
      pointer.x >= PLOT.left &&
      pointer.x <= PLOT.right &&
      pointer.y >= PLOT.top &&
      pointer.y <= PLOT.bottom;

    if (event.pointerType === "touch" && isInsidePlot) {
      if (gestureRef.current?.type === "pinch") {
        suppressClickRef.current = true;
        return;
      }
      activeTouchPointersRef.current.set(event.pointerId, pointer);
      suppressClickRef.current = activeTouchPointersRef.current.size > 1;
      try {
        svgRef.current.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic browser checks may not own a native pointer capture.
      }
      if (activeTouchPointersRef.current.size >= 2) {
        const pointers = pointerPair();
        gestureRef.current = {
          type: "pinch",
          initialView: { ...view },
          initialMidpoint: midpoint(pointers),
          initialDistance: pointerDistance(pointers),
        };
        clearTransientGesture();
        return;
      }
    }
    const markerHandle = event.target.closest?.(".marker-badge, .marker-number");
    const savedMarker = markerHandle?.closest?.(".saved-marker");
    const markerPosition = Number(savedMarker?.dataset.markerPosition);
    if (Number.isInteger(markerPosition)) {
      suppressClickRef.current = true;
      setSelectedMarkerPosition(markerPosition);
      setMovingMarkerPosition(markerPosition);
      gestureRef.current = {
        type: "move-marker",
        markerPosition,
        currentIndex: markers[markerPosition],
        start: clampToPlot(pointer),
        pointerOffsetX:
          pointer.x - xScale(data[markers[markerPosition]].x),
        hasMoved: false,
      };
      setHovered(null);
    } else if (tool === "pan") {
      gestureRef.current = { type: "pan", point: pointer };
    } else if (
      tool === "zoom-in" &&
      pointer.x >= PLOT.left &&
      pointer.x <= PLOT.right &&
      pointer.y >= PLOT.top &&
      pointer.y <= PLOT.bottom
    ) {
      const start = clampToPlot(pointer);
      gestureRef.current = { type: "zoom", start, current: start };
      setZoomSelection({ start, current: start });
      setHovered(null);
    } else if (
      tool === "zoom-out" &&
      pointer.x >= PLOT.left &&
      pointer.x <= PLOT.right &&
      pointer.y >= PLOT.top &&
      pointer.y <= PLOT.bottom
    ) {
      const start = clampToPlot(pointer);
      gestureRef.current = { type: "zoom-out", start, current: start };
      setHovered(null);
    } else if (
      tool === "analysis" &&
      pointer.x >= PLOT.left &&
      pointer.x <= PLOT.right &&
      pointer.y >= PLOT.top &&
      pointer.y <= PLOT.bottom
    ) {
      const start = clampToPlot(pointer);
      gestureRef.current = { type: "analysis", start, current: start };
      setAnalysisSelection({ start, current: start });
      setHovered(null);
    } else {
      return;
    }
    try {
      svgRef.current.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic browser checks may not own a native pointer capture.
    }
  };

  const handlePointerUp = (event) => {
    const gesture = gestureRef.current;
    const wasActiveTouch =
      event.pointerType === "touch" && activeTouchPointersRef.current.has(event.pointerId);
    if (event.pointerType === "touch") {
      activeTouchPointersRef.current.delete(event.pointerId);
    }
    if (gesture?.type === "pinch") {
      if (!wasActiveTouch) return;
      gestureRef.current = null;
      clearTransientGesture();
      releasePointer(event.pointerId);
      if (activeTouchPointersRef.current.size === 0) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      return;
    }
    if (!gesture) {
      releasePointer(event.pointerId);
      if (event.pointerType === "touch" && activeTouchPointersRef.current.size === 0) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      return;
    }
    if (gesture.type === "zoom") {
      const end = clampToPlot(eventToSvgPoint(event));
      const width = Math.abs(end.x - gesture.start.x);
      const height = Math.abs(end.y - gesture.start.y);
      if (width >= ZOOM_DRAG_THRESHOLD && height >= ZOOM_DRAG_THRESHOLD) {
        const left = Math.min(gesture.start.x, end.x);
        const right = Math.max(gesture.start.x, end.x);
        const top = Math.min(gesture.start.y, end.y);
        const bottom = Math.max(gesture.start.y, end.y);
        const minimum = svgPointToValue({ x: left, y: bottom });
        const maximum = svgPointToValue({ x: right, y: top });
        onZoomTo({
          xMin: minimum.x,
          xMax: maximum.x,
          yMin: minimum.value,
          yMax: maximum.value,
        });
      } else {
        onZoomAt(svgPointToValue(end), 0.8);
      }
      setZoomSelection(null);
    } else if (gesture.type === "zoom-out") {
      const end = clampToPlot(eventToSvgPoint(event));
      const distance = Math.hypot(
        end.x - gesture.start.x,
        end.y - gesture.start.y,
      );
      if (distance < ZOOM_DRAG_THRESHOLD) {
        onZoomAt(svgPointToValue(end), 1.25);
      }
    } else if (gesture.type === "analysis") {
      const end = clampToPlot(eventToSvgPoint(event));
      const width = Math.abs(end.x - gesture.start.x);
      if (width >= ZOOM_DRAG_THRESHOLD) {
        const startValue = svgPointToValue(gesture.start);
        const endValue = svgPointToValue(end);
        onAnalysisRange({
          startTime: Math.min(startValue.x, endValue.x),
          endTime: Math.max(startValue.x, endValue.x),
        });
      }
      setAnalysisSelection(null);
    } else if (gesture.type === "move-marker") {
      setMovingMarkerPosition(null);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    gestureRef.current = null;
    releasePointer(event.pointerId);
  };

  const handlePointerCancel = (event) => {
    const wasActiveTouch =
      event.pointerType === "touch" && activeTouchPointersRef.current.has(event.pointerId);
    if (gestureRef.current?.type === "pinch" && !wasActiveTouch) return;
    activeTouchPointersRef.current.delete(event.pointerId);
    gestureRef.current = null;
    suppressClickRef.current = false;
    setZoomSelection(null);
    setAnalysisSelection(null);
    setMovingMarkerPosition(null);
    setHovered(null);
    releasePointer(event.pointerId);
  };

  const handleClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (selectedMarkerPosition !== null) {
      setSelectedMarkerPosition(null);
      return;
    }
    if (tool !== "point") return;
    const nearest = nearestPoint(eventToSvgPoint(event).x);
    if (nearest) onToggleMarker(nearest.index);
  };

  const activeMarkers = markers
    .map((index, order) => ({ point: data[index], order }))
    .filter(
      ({ point }) =>
        point &&
        point.index < data.length &&
        point.x >= view.xMin &&
        point.x <= view.xMax &&
        point.value >= view.yMin &&
        point.value <= view.yMax,
    );

  const analysisBand = (() => {
    if (tool !== "analysis") return null;
    if (analysisSelection) {
      return {
        left: Math.min(analysisSelection.start.x, analysisSelection.current.x),
        right: Math.max(analysisSelection.start.x, analysisSelection.current.x),
      };
    }
    if (!analysisRange) return null;
    const left = clamp(
      xScale(Math.min(analysisRange.startTime, analysisRange.endTime)),
      PLOT.left,
      PLOT.right,
    );
    const right = clamp(
      xScale(Math.max(analysisRange.startTime, analysisRange.endTime)),
      PLOT.left,
      PLOT.right,
    );
    return { left: Math.min(left, right), right: Math.max(left, right) };
  })();

  return (
    <div className="graph-shell" data-testid="graph-shell">
      <div className="axis-title axis-title-y">{yLabel}</div>
      <svg
        ref={svgRef}
        className={`graph ${
          movingMarkerPosition !== null
            ? "is-marker-dragging"
            : tool === "pan"
            ? "is-pan"
            : tool === "point"
              ? "is-point"
              : tool === "zoom-in"
                ? "is-zoom-in"
                : tool === "zoom-out"
                  ? "is-zoom-out"
                  : tool === "analysis"
                    ? "is-analysis"
                : ""
        }`}
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        role="img"
        aria-label={`날짜에 따른 ${yLabel} 그래프. ${data.length}일 샘플`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        onWheel={(event) => {
          event.preventDefault();
          onZoomAt(svgPointToValue(clampToPlot(eventToSvgPoint(event))), event.deltaY < 0 ? 0.82 : 1.22);
        }}
      >
        <defs>
          <clipPath id="plot-clip" clipPathUnits="userSpaceOnUse">
            <rect
              x={PLOT.left}
              y={PLOT.top}
              width={PLOT.right - PLOT.left}
              height={PLOT.bottom - PLOT.top}
            />
          </clipPath>
        </defs>

        <rect
          className="plot-background"
          x={PLOT.left}
          y={PLOT.top}
          width={PLOT.right - PLOT.left}
          height={PLOT.bottom - PLOT.top}
        />

        {Array.from(new Set(makeTicks(Math.ceil(view.xMin), Math.floor(view.xMax), 6).map(Math.round))).map((tick) => {
          const x = xScale(tick);
          return (
            <g key={`x-${tick}`}>
              <line className="grid-line" x1={x} x2={x} y1={PLOT.top} y2={PLOT.bottom} />
              <text className="tick-label" x={x} y={PLOT.bottom+20} textAnchor="middle">
                {formatX(tick)}
              </text>
            </g>
          );
        })}

        {makeTicks(view.yMin, view.yMax, 5).map((tick) => {
          const y = yScale(tick);
          return (
            <g key={`y-${tick}`}>
              <line className="grid-line" x1={PLOT.left} x2={PLOT.right} y1={y} y2={y} />
              <text className="tick-label" x={58} y={y + 5} textAnchor="end">
                {formatY(tick, true)}
              </text>
            </g>
          );
        })}

        {analysisBand ? (
          <g className="analysis-band" clipPath="url(#plot-clip)" pointerEvents="none">
            <rect
              x={analysisBand.left}
              y={PLOT.top}
              width={Math.max(0, analysisBand.right - analysisBand.left)}
              height={PLOT.bottom - PLOT.top}
            />
            <line x1={analysisBand.left} x2={analysisBand.left} y1={PLOT.top} y2={PLOT.bottom} />
            <line x1={analysisBand.right} x2={analysisBand.right} y1={PLOT.top} y2={PLOT.bottom} />
          </g>
        ) : null}

        <g clipPath="url(#plot-clip)" data-testid="plot-data-layer">
          {mode === 3 && areaPoints ? <polygon className="value-area" points={areaPoints} /> : null}
          {linePoints ? <polyline className="value-line" points={linePoints} /> : null}

          {activeMarkers.map(({ point, order }) => {
            const x = xScale(point.x);
            const y = yScale(point.value);
            const tooltipX = clamp(x + 20, PLOT.left + 8, PLOT.right - 160);
            const tooltipY = clamp(y + 18, PLOT.top + 8, PLOT.bottom - 68);
            return (
              <g
                className={`saved-marker${
                  selectedMarkerPosition === order ? " is-selected" : ""
                }${movingMarkerPosition === order ? " is-moving" : ""}`}
                key={point.index}
                data-testid={`saved-marker-${order + 1}`}
                data-point-index={point.index}
                data-marker-position={order}
                data-time={point.x}
              >
                <line className="marker-guide" x1={x} x2={x} y1={PLOT.top} y2={PLOT.bottom} />
                <line className="marker-guide" x1={PLOT.left} x2={x} y1={y} y2={y} />
                <circle className="marker-dot" cx={x} cy={y} r="7" />
                <circle className="marker-badge" cx={x - 10} cy={y - 20} r="15" />
                <text className="marker-number" x={x - 10} y={y - 15} textAnchor="middle">
                  {order + 1}
                </text>
                <g className="marker-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
                  <rect width="148" height="60" rx="7" />
                  <text x="14" y="24">날짜: {formatX(point.x)}</text>
                  <text x="14" y="45">값: {formatY(point.value)}</text>
                </g>
              </g>
            );
          })}

          {hovered && !markers.includes(hovered.index) && !gestureRef.current ? (
            <g className="hover-marker" pointerEvents="none">
              <line x1={xScale(hovered.x)} x2={xScale(hovered.x)} y1={PLOT.top} y2={PLOT.bottom} />
              <line x1={PLOT.left} x2={PLOT.right} y1={yScale(hovered.value)} y2={yScale(hovered.value)} />
              <circle cx={xScale(hovered.x)} cy={yScale(hovered.value)} r="6" />
              <g
                className="hover-tooltip"
                transform={`translate(${clamp(xScale(hovered.x) + 16, PLOT.left, PLOT.right - 176)} ${clamp(
                  yScale(hovered.value) - 72,
                  PLOT.top,
                  PLOT.bottom - 68,
                )})`}
              >
                <rect width="166" height="60" rx="7" />
                <text x="12" y="24">날짜 {formatX(hovered.x)}</text>
                <text x="12" y="45">값 {formatY(hovered.value)}</text>
              </g>
            </g>
          ) : null}
        </g>

        {zoomSelection ? (
          <g className="zoom-selection" clipPath="url(#plot-clip)" pointerEvents="none">
            <rect
              x={Math.min(zoomSelection.start.x, zoomSelection.current.x)}
              y={Math.min(zoomSelection.start.y, zoomSelection.current.y)}
              width={Math.abs(zoomSelection.current.x - zoomSelection.start.x)}
              height={Math.abs(zoomSelection.current.y - zoomSelection.start.y)}
            />
          </g>
        ) : null}
      </svg>
      <div className="axis-title axis-title-x">날짜</div>
    </div>
  );
}
