import { base } from '../interface'
import * as d3 from 'd3'

export class SangerChart {
    yDomain: number[] = [0, 0]
    constructor(data: {[key: string]: base}) {

        for (const base in data) {
            new BaseCurve(data[base], {yDomain: this.yDomain})
        }
    }

    yDomainOfAll(data: {[key: string]: base}) {
        let max = 0
        for (const base in data) {
            for (const key in data[base]) {
                const maxofkey = d3.max(data[base][key as keyof base]) ? d3.max(data[base][key as keyof base])! : max
                max = maxofkey > max ? maxofkey : max;
            }
        }
        this.yDomain = [0, max]
    }
}

export class BaseCurve {
  curve: SVGSVGElement | null;
  /**
   * curve chart with area
   * @param data
   */
  constructor(
    data: base,
    {
      x = (_: any, x: number) => x,
      y = (y: number) => y,
      marginTop = 20, // top margin, in pixels
      marginRight = 30, // right margin, in pixels
      marginBottom = 30, // bottom margin, in pixels
      marginLeft = 40, // left margin, in pixels
      width = 120, // outer width, in pixels
      height = 400, // outer height, in pixels
      yDomain = [0, 0], // y domain
      xType = d3.scaleLinear,
      yType = d3.scaleLinear,
      curve = d3.curveLinear,
      color = {A: "#baf28d", T: "#f26389", C: "#8a9fe3", G: "#f2bc8d"},
    } = {}
  ) {
    const Ya = d3.map(data.A, y);
    const Yt = d3.map(data.T, y);
    const Yg = d3.map(data.G, y);
    const Yc = d3.map(data.C, y);
    const X = d3.map(data.A, x);
    const I = d3.range(X.length);
    const xDomain = d3.extent(I) as [number, number];

    const xScale = xType(xDomain, [marginLeft, width - marginRight]);
    const yScale = yType(yDomain, [height - marginBottom, marginTop]);
    // const yAxis = d3.axisLeft(yScale).ticks(height / 40);

    const areaA = d3
      .area()
      .curve(curve)
      .x((_, i) => xScale(X[i]))
      .y0(yScale(0))
      .y1((_, i) => yScale(Ya[i]));
    const areaT = d3
      .area()
      .curve(curve)
      .x((_, i) => xScale(X[i]))
      .y0(yScale(0))
      .y1((_, i) => yScale(Yt[i]));
    const areaG = d3
      .area()
      .curve(curve)
      .x((_, i) => xScale(X[i]))
      .y0(yScale(0))
      .y1((_, i) => yScale(Yg[i]));
    const areaC = d3
      .area()
      .curve(curve)
      .x((_, i) => xScale(X[i]))
      .y0(yScale(0))
      .y1((_, i) => yScale(Yc[i]));
    const lineA = d3
        .line()
        .curve(curve)
        .x((_, i) => xScale(X[i]))
        .y((_, i) => yScale(Ya[i]));
    const lineT = d3
        .line()
        .curve(curve)
        .x((_, i) => xScale(X[i]))
        .y((_, i) => yScale(Yt[i]));
    const lineG = d3
        .line()
        .curve(curve)
        .x((_, i) => xScale(X[i]))
        .y((_, i) => yScale(Yg[i]));
    const lineC = d3
        .line()
        .curve(curve)
        .x((_, i) => xScale(X[i]))
        .y((_, i) => yScale(Yc[i]));

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // svg
    //   .append("g")
    //   .attr("transform", `translate(${marginLeft},0)`)
    //   .call(yAxis)
    //   .call((g) => g.select(".domain").remove())
    //   .call((g) =>
    //     g
    //       .selectAll(".tick line")
    //       .clone()
    //       .attr("x2", width - marginLeft - marginRight)
    //       .attr("stroke-opacity", 0.1)
    //   )
    //   .call(
    //     (g) =>
    //       g
    //         .append("text")
    //         .attr("x", -marginLeft)
    //         .attr("y", 10)
    //         .attr("fill", "currentColor")
    //         .attr("text-anchor", "start")
    //     //   .text(yLabel)
    //   );
    svg
      .append("path")
      .attr("fill", color.A)
      .attr("opacity", 0.4)
      .attr("d", areaA(I));
    svg
      .append("path")
      .attr("fill", color.T)
      .attr("opacity", 0.4)
      .attr("d", areaT(I));
    svg
      .append("path")
      .attr("fill", color.G)
      .attr("opacity", 0.4)
      .attr("d", areaG(I));
    svg
      .append("path")
      .attr("fill", color.C)
      .attr("opacity", 0.4)
      .attr("d", areaC(I));
    svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color.A)
        .attr("stroke-width", 1.5)
        .attr("d", lineA(I));
    svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color.T)
        .attr("stroke-width", 1.5)
        .attr("d", lineT(I));
    svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color.G)
        .attr("stroke-width", 1.5)
        .attr("d", lineG(I));
    svg
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color.C)
        .attr("stroke-width", 1.5)
        .attr("d", lineC(I));
    this.curve = svg.node();
  }
}