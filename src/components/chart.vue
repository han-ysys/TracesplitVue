<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { SangerChart } from '../utils/curve'
import testdata from '../test_data/trace_data.json'
const chart = ref()
onMounted(() => {
    const sangerchart = new SangerChart(testdata);
    // append chart to dom
    (chart.value as HTMLElement).appendChild(sangerchart.svg.node()!)
    console.log(sangerchart.svg)
})
</script>

<template>
    <div ref="chart"></div>
</template>