import { base } from '../interface'
import * as d3 from 'd3'

export class SangerChart {
  length: number = 0;
  svg!: d3.Selection<SVGSVGElement, any, any, any>;
  yDomain: number[] = [0, 0];
  xDomain: number[] = [0, 0];
  data: { [key: string]: base };
  yScale!: d3.ScaleLinear<number, number, never>;
  xScale!: d3.ScaleLinear<number, number, never>;
  area!: {
    A: d3.Area<[number, number]>;
    T: d3.Area<[number, number]>;
    G: d3.Area<[number, number]>;
    C: d3.Area<[number, number]>;
  };
  line!: {
    A: d3.Line<[number, number]>;
    T: d3.Line<[number, number]>;
    G: d3.Line<[number, number]>;
    C: d3.Line<[number, number]>;
  };
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number; };
  gx!: d3.Selection<SVGGElement, any, any, any>;
  xAxis!: d3.Axis<d3.NumberValue>;
  areaPath!: { A: d3.Selection<SVGPathElement, any, any, any>; T: d3.Selection<SVGPathElement, any, any, any>; C: d3.Selection<SVGPathElement, any, any, any>; G: d3.Selection<SVGPathElement, any, any, any>; };
  linePath!: { A: d3.Selection<SVGPathElement, any, any, any>; T: d3.Selection<SVGPathElement, any, any, any>; C: d3.Selection<SVGPathElement, any, any, any>; G: d3.Selection<SVGPathElement, any, any, any>; };
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
    this.shapeOfData();
    this.axisInitialize();
    this.appendPath();
    this.setZoom();
  }

  shapeOfData() {
    let ymax = 0;
    let xlength = 0;
    for (const base in this.data) {
      xlength += this.data[base].A.length;
      for (const key in this.data[base]) {
        const maxofkey = d3.max(this.data[base][key as keyof base])
          ? d3.max(this.data[base][key as keyof base])!
          : ymax;
        ymax = maxofkey > ymax ? maxofkey : ymax;
      }
    }
    this.length = Object.keys(this.data).length;
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
    const xScale_by_base = d3.scaleLinear(
      [0, this.length],
      [this.margin.left, this.width - this.margin.right]
    );
    this.xAxis = d3.axisBottom(xScale_by_base).ticks(this.width / 40);

    this.svg = d3
      .create("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
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
      .append("g")
      .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .call(this.xAxis, this.xScale);
  }

  appendPath(
    x = (_: any, x: number) => x,
    y = (y: number) => y,
    curve = d3.curveLinear,
    color = { A: "#baf28d", T: "#f26389", C: "#8a9fe3", G: "#f2bc8d" }
  ) {
    const Ya = d3.map(SangerChart.baseTrace(this.data, "A"), y);
    const Yt = d3.map(SangerChart.baseTrace(this.data, "T"), y);
    const Yg = d3.map(SangerChart.baseTrace(this.data, "G"), y);
    const Yc = d3.map(SangerChart.baseTrace(this.data, "C"), y);
    const X = d3.map(SangerChart.baseTrace(this.data, "A"), x);
    const I = d3.range(this.xDomain[1]);

    this.area = {
      A: d3
        .area()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y0(this.yScale(0))
        .y1((_, i) => this.yScale(Ya[i])),
      T: d3
        .area()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y0(this.yScale(0))
        .y1((_, i) => this.yScale(Yt[i])),
      G: d3
        .area()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y0(this.yScale(0))
        .y1((_, i) => this.yScale(Yg[i])),
      C: d3
        .area()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y0(this.yScale(0))
        .y1((_, i) => this.yScale(Yc[i])),
    };
    this.line = {
      A: d3
        .line()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y((_, i) => this.yScale(Ya[i])),
      T: d3
        .line()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y((_, i) => this.yScale(Yt[i])),
      G: d3
        .line()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y((_, i) => this.yScale(Yg[i])),
      C: d3
        .line()
        .curve(curve)
        .x((_, i) => this.xScale(X[i]))
        .y((_, i) => this.yScale(Yc[i])),
    };
    this.areaPath = {
      A: this.svg.append("path").attr("fill", color.A).attr("opacity", 0.4),
      T: this.svg.append("path").attr("fill", color.T).attr("opacity", 0.4),
      C: this.svg.append("path").attr("fill", color.C).attr("opacity", 0.4),
      G: this.svg.append("path").attr("fill", color.G).attr("opacity", 0.4),
    };
    this.linePath = {
      A: this.svg.append("path").attr("stroke", color.A).attr("opacity", 0.4),
      T: this.svg.append("path").attr("stroke", color.T).attr("opacity", 0.4),
      C: this.svg.append("path").attr("stroke", color.C).attr("opacity", 0.4),
      G: this.svg.append("path").attr("stroke", color.G).attr("opacity", 0.4),
    };
    this.linePath.A.attr("d", this.area.A(I));
    this.linePath.T.attr("d", this.area.T(I));
    this.linePath.G.attr("d", this.area.G(I));
    this.linePath.C.attr("d", this.area.C(I));
    this.areaPath.A.attr("d", this.area.A(I));
    this.areaPath.T.attr("d", this.area.T(I));
    this.areaPath.G.attr("d", this.area.G(I));
    this.areaPath.C.attr("d", this.area.C(I));
  }

  static baseTrace(data: { [key: string]: base }, base: "A" | "T" | "C" | "G") {
    let baseTrace: number[] = [];
    for (const each in data) {
      baseTrace = baseTrace.concat(data[each][base]);
    }
    return baseTrace;
  }

  setZoom() {
    const zoomed = (event: any) => {
      const xz = event.transform.rescaleX(this.xScale);
      this.areaPath.A.attr("d", this.area.A(xz));
      this.gx.call(this.xAxis, xz);
    };
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 32])
      .extent([
        [this.margin.left, 0],
        [this.width - this.margin.right, this.height],
      ])
      .translateExtent([
        [this.margin.left, -Infinity],
        [this.width - this.margin.right, Infinity],
      ])
      .on("zoom", zoomed);
    this.svg.call(zoom)
    .transition()
    .duration(750)
    .call(zoom.scaleTo, 4, [this.xScale(this.xDomain[0]), this.xScale(this.xDomain[1])]);
  }
}