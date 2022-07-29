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
  constructor(
    data: { [key: string]: base }
  ) {
    this.data = data;
    this.shapeOfData();
    this.axisInitialize();
    this.appendPath();
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

  axisInitialize(
    width = 2000,
    height = 400,
    margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 60,
    }
  ) {
    this.yScale = d3.scaleLinear(this.yDomain, [
      height - margin.bottom,
      margin.top,
    ]);
    const yAxis = d3.axisLeft(this.yScale).ticks(height / 40);
    this.xScale = d3.scaleLinear(this.xDomain, [
      margin.left,
      width - margin.right,
    ]);
    const xScale_by_base = d3.scaleLinear(
      [0, this.length],
      [margin.left, width - margin.right]
    );
    const xAxis = d3.axisBottom(xScale_by_base).ticks(width / 40);

    this.svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    this.svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Trace")
      );
    this.svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Position")
      );
      
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
    const area = {
      A: this.svg.append("path").attr("fill", color.A).attr("opacity", 0.4),
      T: this.svg.append("path").attr("fill", color.T).attr("opacity", 0.4),
      C: this.svg.append("path").attr("fill", color.C).attr("opacity", 0.4),
      G: this.svg.append("path").attr("fill", color.G).attr("opacity", 0.4),
    };
    const line = {
      A: this.svg.append("path").attr("stroke", color.A).attr("opacity", 0.4),
      T: this.svg.append("path").attr("stroke", color.T).attr("opacity", 0.4),
      C: this.svg.append("path").attr("stroke", color.C).attr("opacity", 0.4),
      G: this.svg.append("path").attr("stroke", color.G).attr("opacity", 0.4),
    };
    line.A.attr("d", this.area.A(I));
    line.T.attr("d", this.area.T(I));
    line.G.attr("d", this.area.G(I));
    line.C.attr("d", this.area.C(I));
    area.A.attr("d", this.area.A(I));
    area.T.attr("d", this.area.T(I));
    area.G.attr("d", this.area.G(I));
    area.C.attr("d", this.area.C(I));
  }

  static baseTrace(data: { [key: string]: base }, base: "A" | "T" | "C" | "G") {
    let baseTrace: number[] = [];
    for (const each in data) {
      baseTrace = baseTrace.concat(data[each][base]);
    }
    return baseTrace;
  }
}