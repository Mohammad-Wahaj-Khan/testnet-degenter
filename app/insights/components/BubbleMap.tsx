"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";

type Token = {
  symbol: string;
  name: string;
  imageUri?: string;
  mcapUsd?: number;
  priceChange?: Record<string, number> | number;
  priceUsd?: number;
  volume?: Record<string, number> | number;
  volumeUSD?: Record<string, number>;
  volUsd?: number;
};

type BubbleToken = Omit<Token, "priceChange"> & {
  radius: number;
  priceChange: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

type BubbleMapProps = {
  tokens?: Token[];
  data?: Token[];
  timeFrame?: string;
};

const BubbleMap: React.FC<BubbleMapProps> = ({
  tokens,
  data,
  timeFrame = "24H",
}) => {
  // Function to filter tokens based on timeFrame
  const filterTokensByTimeFrame = (tokens: Token[]): Token[] => {
    if (!tokens.length) return [];
    
    // In a real app, you would filter based on the actual timeFrame
    // For now, we'll just return all tokens
    return [...tokens];
  };
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
  const [hoveredToken, setHoveredToken] = useState<BubbleToken | null>(null);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const sourceTokens = useMemo(() => tokens ?? data ?? [], [tokens, data]);

  const normalizeTimeFrame = (value: string) => value.trim().toLowerCase();
  const getVolumeUsd = (token: Token, frame: string) => {
    const key = normalizeTimeFrame(frame);
    const frameVolume = token.volumeUSD?.[key];
    if (typeof frameVolume === "number") return frameVolume;
    if (typeof token.volUsd === "number") return token.volUsd;
    if (typeof token.volume === "number") return token.volume;
    if (token.volume && typeof token.volume === "object") {
      return token.volume[key] ?? 0;
    }
    return 0;
  };
  const getPriceChange = (token: Token, frame: string) => {
    if (typeof token.priceChange === "number") return token.priceChange;
    if (!token.priceChange) return 0;
    const key = normalizeTimeFrame(frame);
    const candidates = [key, key.toUpperCase(), "24h", "24H"];
    for (const candidate of candidates) {
      const value = token.priceChange?.[candidate];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  // Update filtered tokens when source tokens or timeFrame changes
  useEffect(() => {
    setFilteredTokens(filterTokensByTimeFrame(sourceTokens));
  }, [sourceTokens, timeFrame]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.max(600, window.innerHeight - 200);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const simulation = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current || !filteredTokens.length) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const jitterForce = (strength: number) => {
      let nodes: BubbleToken[] = [];
      const force = () => {
        for (const node of nodes) {
          node.vx = (node.vx ?? 0) + (Math.random() - 0.5) * strength;
          node.vy = (node.vy ?? 0) + (Math.random() - 0.5) * strength;
        }
      };
      force.initialize = (newNodes: BubbleToken[]) => {
        nodes = newNodes;
      };
      return force;
    };

    // Add drag behavior
    const drag = d3.drag()
      .on("start", function(event: any) {
        if (!event.active && simulation.current) simulation.current.alphaTarget(0.3).restart();
        const d = event.subject;
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function(event: any) {
        const d = event.subject;
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", function(event: any) {
        if (!event.active && simulation.current) simulation.current.alphaTarget(0);
        const d = event.subject;
        d.fx = null;
        d.fy = null;
      });

    const processedTokens: BubbleToken[] = filteredTokens
      .filter(
        (token) =>
          (getVolumeUsd(token, timeFrame) ?? 0) > 0
      )
      .map((token) => {
        const sizeValue = Math.max(getVolumeUsd(token, timeFrame) || 0, 1);
        return {
          ...token,
          radius: Math.sqrt(sizeValue) / 500,
          priceChange: getPriceChange(token, timeFrame),
        };
      })
      .sort(
        (a, b) => getVolumeUsd(b, timeFrame) - getVolumeUsd(a, timeFrame)
      )
      .slice(0, 60);

    const maxRadius =
      d3.max(processedTokens, (d: BubbleToken) => d.radius) || 100;
    const minRadius =
      d3.min(processedTokens, (d: BubbleToken) => d.radius) || 10;

    const radiusScale = d3
      .scaleSqrt()
      .domain([minRadius, maxRadius])
      .range([25, 120]);

    simulation.current = d3
      .forceSimulation(processedTokens)
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03))
      .force("jitter", jitterForce(0.06))
      .force(
        "collide",
        d3.forceCollide((d: BubbleToken) => radiusScale(d.radius) + 10)
      )
      .velocityDecay(0.22)
      .alphaDecay(0)
      .alphaMin(0);

    const container = svg.append("g");
    const defs = svg.append("defs");

    ["positive", "negative"].forEach((type) => {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${type}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");

      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "coloredBlur");

      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    ["positive", "negative"].forEach((type) => {
      const filter = defs
        .append("filter")
        .attr("id", `shadow-${type}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");

      filter
        .append("feDropShadow")
        .attr("dx", "0")
        .attr("dy", "6")
        .attr("stdDeviation", "10")
        .attr("flood-opacity", "0.6")
        .attr("flood-color", type === "positive" ? "#16a34a" : "#dc2626");
    });

    const nodes = container
      .selectAll(".bubble-node")
      .data(processedTokens)
      .enter()
      .append("g")
      .attr('class', 'bubble-node')
      .style('cursor', 'move')
      .style('user-select', 'none')
      .style('-webkit-user-select', 'none')
      .style('-moz-user-select', 'none')
      .style('-ms-user-select', 'none')
      .call(drag);

    nodes.each(function (this: SVGGElement, d: BubbleToken) {
      const node = d3.select(this);
      const r = radiusScale(d.radius);
      const isPositive = (d.priceChange ?? 0) >= 0;
      const gradientId = `gradient-${d.symbol}-${Math.random()}`;
      const clipId = `clip-${d.symbol}-${Math.random()}`;

      const gradient = defs.append("radialGradient").attr("id", gradientId);
      defs
        .append("clipPath")
        .attr("id", clipId)
        .append("circle")
        .attr("r", r * 0.92);

      if (isPositive) {
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#15251aff");
        gradient
          .append("stop")
          .attr("offset", "80%")
          .attr("stop-color", "#051e05");
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#02a602");
      } else {
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#1b0f0f");
        gradient
          .append("stop")
          .attr("offset", "80%")
          .attr("stop-color", "#1e0505");
        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#870303");
      }

      node
        .append("circle")
        .attr("class", "glow-circle")
        .attr("r", r + 6)
        .attr("fill", "none")
        // .attr("stroke", isPositive ? "#22c55e" : "#ef4444")
        .attr("stroke-width", 6)
        .attr("opacity", 0.65)
        // .style("filter", `url(#glow-${isPositive ? "positive" : "negative"})`);

      node
        .append("circle")
        .attr("class", "main-circle")
        .attr("r", r)
        .attr("fill", `url(#${gradientId})`)
        // .attr("stroke", isPositive ? "#16a34a" : "#dc2626")
        // .attr("stroke-width", 2)
        // .style("filter", `url(#shadow-${isPositive ? "positive" : "negative"})`);

      if (d.imageUri) {
        node
          .append("image")
          .attr("xlink:href", d.imageUri)
          .attr("x", -r * 0.28)
          .attr("y", -r * 0.62)
          .attr("width", r * 0.56)
          .attr("height", r * 0.56)
          .attr("clip-path", `circle(${r * 0.28}px)`);
      }

      const textGroup = node
        .append("g")
        .attr("clip-path", `url(#${clipId})`);

      textGroup
        .append("text")
        .attr("class", "symbol-text")
        .attr("text-anchor", "middle")
        .attr("dy", d.imageUri ? r * 0.18 : -2)
        .attr("fill", "white")
        .attr("textLength", r * 1.4)
        .attr("lengthAdjust", "spacingAndGlyphs")
        .style("font-weight", "700")
        .style("font-size", `${Math.max(9, Math.min(r * 0.5, r / 2.8))}px`)
        .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)")
        .style("letter-spacing", "0.5px")
        .text(d.symbol);

      textGroup
        .append("text")
        .attr("class", "percentage-text")
        .attr("text-anchor", "middle")
        .attr("dy", d.imageUri ? r * 0.5 : r * 0.65)
        .attr("fill", (d.priceChange ?? 0) >= 0 ? "#86efac" : "#fca5a5")
        .attr("textLength", r * 1.2)
        .attr("lengthAdjust", "spacingAndGlyphs")
        .style("font-weight", "600")
        .style("font-size", `${Math.max(8, Math.min(r * 0.45, r / 3))}px`)
        .style("text-shadow", "0 1px 3px rgba(0,0,0,0.9)")
        .text(
          `${(d.priceChange ?? 0) >= 0 ? "+" : ""}${(
            d.priceChange ?? 0
          ).toFixed(2)}%`
        );
    });

    nodes
      .on(
        "mouseenter",
        function (this: SVGGElement, event: any, d: BubbleToken) {
          setHoveredToken(d);
          d3.select(this).raise();
          d3.select(this)
            .select(".main-circle")
            .transition()
            .duration(200)
            .attr("r", radiusScale(d.radius) * 1.15)
            .attr("stroke-width", 3.5);

          d3.select(this)
            .select(".glow-circle")
            .transition()
            .duration(200)
            .attr("r", radiusScale(d.radius) * 1.2)
            .attr("opacity", 0.6);
        }
      )
      .on(
        "mouseleave",
        function (this: SVGGElement, event: any, d: BubbleToken) {
          setHoveredToken(null);
          d3.select(this)
            .select(".main-circle")
            .transition()
            .duration(200)
            .attr("r", radiusScale(d.radius))
            .attr("stroke-width", 2.5);

          d3.select(this)
            .select(".glow-circle")
            .transition()
            .duration(200)
            .attr("r", radiusScale(d.radius) + 3)
            .attr("opacity", 0.3);
        }
      );

    // Initialize positions if not set
    processedTokens.forEach(d => {
      d.x = d.x ?? Math.random() * width;
      d.y = d.y ?? Math.random() * height;
    });

    if (simulation.current) {
      simulation.current.nodes(processedTokens).on("tick", () => {
        nodes.attr("transform", (d: BubbleToken) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });
    }

    return () => {
      if (simulation.current) {
        simulation.current.stop();
      }
    };
  }, [filteredTokens, dimensions, timeFrame]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#0a0a0a] rounded-lg border border-zinc-800"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
      />

      {hoveredToken && (
        <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl min-w-[200px] z-10">
          <div className="flex items-center gap-2 mb-2">
            {hoveredToken.imageUri && (
              <img
                src={hoveredToken.imageUri}
                alt=""
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
            <div>
              <div className="font-bold text-white">{hoveredToken.symbol}</div>
              <div className="text-xs text-zinc-400">{hoveredToken.name}</div>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Change:</span>
              <span
                className={
                  (hoveredToken.priceChange ?? 0) >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {(hoveredToken.priceChange ?? 0) >= 0 ? "+" : ""}
                {hoveredToken.priceChange?.toFixed(2)}%
              </span>
            </div>
            {hoveredToken.mcapUsd && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Market Cap:</span>
                <span className="text-white">
                  ${(hoveredToken.mcapUsd / 1000000).toFixed(2)}M
                </span>
              </div>
            )}
            {hoveredToken.priceUsd && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Price:</span>
                <span className="text-white">
                  ${hoveredToken.priceUsd.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BubbleMap;