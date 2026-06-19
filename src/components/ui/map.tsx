import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  labelPosition?: "top" | "bottom" | "left" | "right";
}

interface MapProps {
  dots?: Array<{
    start: MapPoint;
    end: MapPoint;
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

export function WorldMap({
  dots = [],
  lineColor = "#ea580c", // matches primary theme orange
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check dark mode state dynamically in Vite environment
  useEffect(() => {
    if (!mounted) return;
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [mounted]);

  const map = useMemo(() => {
    if (!mounted) return null;
    // Handle both ESM and CommonJS exports
    const MapConstructor = (DottedMap as any).default || DottedMap;
    return new MapConstructor({ height: 100, grid: "diagonal" });
  }, [mounted]);

  const svgMap = useMemo(() => {
    if (!map) return "";
    return map.getSVG({
      radius: 0.22,
      color: isDark ? "#ffffff25" : "#00000025",
      shape: "circle",
      backgroundColor: isDark ? "black" : "white",
    });
  }, [map, isDark]);

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Extract unique locations from dots to render markers and labels only once
  const uniquePoints = useMemo(() => {
    const pointsMap = new Map<string, MapPoint>();

    dots.forEach(dot => {
      if (dot.start.label) {
        pointsMap.set(dot.start.label, dot.start);
      }
      if (dot.end.label) {
        pointsMap.set(dot.end.label, dot.end);
      }
    });

    return Array.from(pointsMap.values());
  }, [dots]);

  // Helper to get label coordinate positioning based on labelPosition
  const getLabelCoords = (x: number, y: number, position: "top" | "bottom" | "left" | "right" = "top") => {
    const width = 120;
    const height = 30;
    switch (position) {
      case "bottom":
        return { x: x - width / 2, y: y + 15 };
      case "left":
        return { x: x - width - 12, y: y - height / 2 };
      case "right":
        return { x: x + 12, y: y - height / 2 };
      case "top":
      default:
        return { x: x - width / 2, y: y - height - 5 };
    }
  };

  // Helper to align inner flex content based on labelPosition
  const getAlignmentClass = (position: "top" | "bottom" | "left" | "right" = "top") => {
    switch (position) {
      case "left":
        return "justify-end text-right";
      case "right":
        return "justify-start text-left";
      case "bottom":
      case "top":
      default:
        return "justify-center text-center";
    }
  };

  // Calculate animation timing
  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2; // Pause for 2 seconds when all paths are drawn
  const fullCycleDuration = totalAnimationTime + pauseTime;

  if (!mounted) {
    return (
      <div className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden flex items-center justify-center border border-gray-100 dark:border-neutral-900 shadow-soft">
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          Loading culinary journey map...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden">
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none object-cover"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Draw connection paths */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          // Calculate keyframe times for this specific path
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={loop ? {
                  pathLength: [0, 0, 1, 1, 0],
                } : {
                  pathLength: 1
                }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: "easeInOut",
                }}
              />

              {loop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0,
                  }}
                  style={{
                    offsetPath: `path('${createCurvedPath(startPoint, endPoint)}')`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Draw unique location markers and labels */}
        {uniquePoints.map((point, i) => {
          const projected = projectPoint(point.lat, point.lng);
          const labelPos = point.labelPosition || "top";
          const labelCoords = getLabelCoords(projected.x, projected.y, labelPos);

          return (
            <g key={`points-group-${i}`}>
              <motion.g
                onHoverStart={() => setHoveredLocation(point.label || `Location ${i}`)}
                onHoverEnd={() => setHoveredLocation(null)}
                className="cursor-pointer"
                whileHover={{ scale: 1.25 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r="4.5"
                  fill={lineColor}
                  filter="url(#glow)"
                  className="drop-shadow-lg"
                />
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r="4.5"
                  fill={lineColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="4.5"
                    to="14"
                    dur="2s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="2s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </motion.g>

              {showLabels && point.label && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 * i + 0.3, duration: 0.4 }}
                  className="pointer-events-none"
                >
                  <foreignObject
                    x={labelCoords.x}
                    y={labelCoords.y}
                    width="120"
                    height="30"
                    className="overflow-visible"
                  >
                    <div className={`flex items-center h-full ${getAlignmentClass(labelPos)}`}>
                      <span className="text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-md bg-white/95 dark:bg-black/95 text-black dark:text-white border border-gray-200 dark:border-neutral-800 shadow-sm whitespace-nowrap">
                        {point.label}
                      </span>
                    </div>
                  </foreignObject>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Mobile Tooltip */}
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 text-black dark:text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm sm:hidden border border-gray-200 dark:border-neutral-800"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
