import { base } from '../interface'
import * as d3 from 'd3'
import { NumberValue } from 'd3';

export class SangerChart {
  length: number = 0;
  svg!: d3.Selection<SVGSVGElement, any, any, any>;
  yDomain: number[] = [0, 0];
  xDomain: number[] = [0, 0];
  data: { [key: string]: base };
  yScale!: d3.ScaleLinear<number, number, never>;
  xScale!: d3.ScaleLinear<number, number, never>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  gx!: d3.Selection<SVGGElement, any, any, any>;
  areaPath!: {
    A: d3.Selection<SVGPathElement, any, any, any>;
    T: d3.Selection<SVGPathElement, any, any, any>;
    C: d3.Selection<SVGPathElement, any, any, any>;
    G: d3.Selection<SVGPathElement, any, any, any>;
  };
  linePath!: {
    A: d3.Selection<SVGPathElement, any, any, any>;
    T: d3.Selection<SVGPathElement, any, any, any>;
    C: d3.Selection<SVGPathElement, any, any, any>;
    G: d3.Selection<SVGPathElement, any, any, any>;
  };
  I!: number[];
  area!: {
    A: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    T: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    G: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    C: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
  };
  line!: {
    A: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    T: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    G: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
    C: (data: any, x?: d3.ScaleLinear<number, number, never>) => string | null;
  };
  xAxis!: (g: any, x: any) => any;
  basePos: [number, string][];
  constructor(
    data: { [key: string]: base },
    {
      width = 2000,
      height = 400,
      margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 60,
      },
    } = {}
  ) {
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.data = data;
    this.svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    let pos = 0
    this.basePos = [];
    for (const base in this.data) {
      const length = this.data[base].A.length;
      pos += length;
      this.basePos.push([(Math.ceil(pos - length / 2)), call(this.data[base])]);
    }
    this.shapeOfData(data);
    this.axisInitialize();
    this.appendPath();
    this.basecall();
    this.setZoom();

    function call(base: base) {
      const maxArray: { [key: string]: number } = {};
      for (const type in base) {
        maxArray[type] = Math.max(...base[type as keyof base]);
      }
      const max = Math.max(...Object.values(maxArray));
      switch (max) {
        case maxArray.A:
          return "A";
        case maxArray.T:
          return "T";
        case maxArray.C:
          return "C";
        case maxArray.G:
          return "G";
      }
      return "N";
    }
  }

  shapeOfData(data: { [key: string]: base }) {
    let ymax = 0;
    let xlength = 0;
    for (const base in data) {
      xlength += data[base].A.length;
      for (const key in data[base]) {
        const maxofkey = d3.max(data[base][key as keyof base])
          ? d3.max(data[base][key as keyof base])!
          : ymax;
        ymax = maxofkey > ymax ? maxofkey : ymax;
      }
    }
    this.length = Object.keys(data).length;
    this.yDomain = [0, ymax];
    this.xDomain = [0, xlength];
  }

  axisInitialize() {
    this.yScale = d3.scaleLinear(this.yDomain, [
      this.height - this.margin.bottom,
      this.margin.top,
    ]);
    const yAxis = d3.axisLeft(this.yScale).ticks(this.height / 40);
    this.xScale = d3.scaleLinear(this.xDomain, [
      this.margin.left,
      this.width - this.margin.right,
    ]);
    this.xAxis = (g, x) =>
      g
        .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .call(
          d3
            .axisBottom(x)
            .tickValues(this.basePos.map((base) => base[0]))
            .tickFormat((d, i) =>
              (i+1) % 10 === 0
                ? (this.basePos.map((base) => base[0]).indexOf(d as number) + 1).toString()
                : ""
            )
            .tickSizeOuter(0)
        );


    this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", this.width - this.margin.left - this.margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", -this.margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Trace")
      );
    this.gx = this.svg
      .append("g");
  }

  appendPath(
    x = (_: any, x: number) => x,
    y = (y: number) => y,
    curve = d3.curveNatural,
    color = { A: "#baf28d", T: "#f26389", C: "#8a9fe3", G: "#f2bc8d" }
  ) {
    const Ya = d3.map(SangerChart.baseTrace(this.data, "A"), y);
    const Yt = d3.map(SangerChart.baseTrace(this.data, "T"), y);
    const Yg = d3.map(SangerChart.baseTrace(this.data, "G"), y);
    const Yc = d3.map(SangerChart.baseTrace(this.data, "C"), y);
    const X = d3.map(SangerChart.baseTrace(this.data, "A"), x);
    this.I = d3.range(this.xDomain[1]);

    this.svg
      .append("clipPath")
      .attr("id", "clipclip")
      .append("rect")
      .attr("x", this.margin.left)
      .attr("y", 0)
      .attr("width", this.width - this.margin.left - this.margin.right)
      .attr("height", this.height - this.margin.bottom);

    this.area = {
      A: (data, x = this.xScale) =>
        d3
          .area()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y0(this.yScale(0))
          .y1((_, i) => this.yScale(Ya[i]))(data),
      T: (data, x = this.xScale) =>
        d3
          .area()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y0(this.yScale(0))
          .y1((_, i) => this.yScale(Yt[i]))(data),
      G: (data, x = this.xScale) =>
        d3
          .area()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y0(this.yScale(0))
          .y1((_, i) => this.yScale(Yg[i]))(data),
      C: (data, x = this.xScale) =>
        d3
          .area()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y0(this.yScale(0))
          .y1((_, i) => this.yScale(Yc[i]))(data),
    };
    this.line = {
      A: (data, x = this.xScale) =>
        d3
          .line()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y((_, i) => this.yScale(Ya[i]))(data),
      T: (data, x = this.xScale) =>
        d3
          .line()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y((_, i) => this.yScale(Yt[i]))(data),
      G: (data, x = this.xScale) =>
        d3
          .line()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y((_, i) => this.yScale(Yg[i]))(data),
      C: (data, x = this.xScale) =>
        d3
          .line()
          .curve(curve)
          .x((_, i) => x(X[i]))
          .y((_, i) => this.yScale(Yc[i]))(data),
    };
    this.areaPath = {
      A: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("fill", color.A)
        .attr("opacity", 0.4)
        .attr("stroke", color.A)
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round"),
      T: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("fill", color.T)
        .attr("opacity", 0.4)
        .attr("stroke", color.T)
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round"),
      C: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("fill", color.C)
        .attr("opacity", 0.4)
        .attr("stroke", color.C)
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round"),
      G: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("fill", color.G)
        .attr("opacity", 0.4)
        .attr("stroke", color.G)
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round"),
    };
    this.linePath = {
      A: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("stroke", color.A)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("fill", "none"),
      T: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("stroke", color.T)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("fill", "none"),
      C: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("stroke", color.C)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("fill", "none"),
      G: this.svg
        .append("path")
        .attr(
          "clip-path",
          "url(" + new URL("#clipclip", window.location.href) + ")"
        )
        .attr("stroke", color.G)
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("fill", "none"),
    };
  }

  static baseTrace(data: { [key: string]: base }, base: "A" | "T" | "C" | "G") {
    let baseTrace: number[] = [];
    for (const each in data) {
      baseTrace = baseTrace.concat(data[each][base]);
    }
    return baseTrace;
  }

  basecall() {
    this.svg
      .selectAll(".basecalltext")
      .data(this.basePos)
      .enter()
      .append("text")
      .attr("x", (d) => {
        return this.xScale(d[0] as NumberValue)
      })
      .attr("y", 20)
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("class", "basecall")
      .attr(
        "clip-path",
        "url(" + new URL("#clipclip", window.location.href) + ")"
      )
      .style("fill", d => {
        // console.log(d)
        if (d[1] === "A") {
          return "#baf28d";
        } else if (d[1] === "T") {
          return "#f26389";
        } else if (d[1] === "C") {
          return "#8a9fe3";
        } else if (d[1] === "G") {
          return "#f2bc8d";
        } else {
          return "#000000";
        }
      })
      .text((d) => d[1]);
  }

  setZoom() {
    
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 16])
      .extent([
        [this.margin.left, 0],
        [this.width - this.margin.right, this.height],
      ])
      .translateExtent([
        [this.margin.left, -Infinity],
        [this.width - this.margin.right, Infinity],
      ])
      .on("zoom", zoomed);
      const graph = this
      function zoomed (event: any) {
        const xz = event.transform.rescaleX(graph.xScale);
        graph.svg.selectAll(".basecall").attr("x", (d) => {
          return xz((d as (NumberValue | string)[])[0]);
        });
        if (event.transform.k < 2.8) {
          graph.svg.selectAll(".basecall").style("display", "none");
        }
        else {
          graph.svg.selectAll(".basecall").style("display", "inline");
        }
        graph.areaPath.A.attr("d", graph.area.A(graph.I, xz));
        graph.areaPath.T.attr("d", graph.area.T(graph.I, xz));
        graph.areaPath.G.attr("d", graph.area.G(graph.I, xz));
        graph.areaPath.C.attr("d", graph.area.C(graph.I, xz));
        graph.linePath.A.attr("d", graph.line.A(graph.I, xz));
        graph.linePath.T.attr("d", graph.line.T(graph.I, xz));
        graph.linePath.G.attr("d", graph.line.G(graph.I, xz));
        graph.linePath.C.attr("d", graph.line.C(graph.I, xz));
        graph.gx.call(graph.xAxis, xz);
      }
    this.svg
      .call(zoom)
      .transition()
      .duration(750)
      .call(zoom.scaleTo, 4);
  }
}