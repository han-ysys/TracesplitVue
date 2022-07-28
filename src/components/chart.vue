<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { BaseCurve } from '../utils/curve'
import testdata from '../test_data/trace_data.json'
const chart = ref()
onMounted(() => {
    const curve = new BaseCurve(testdata['0'], { yDomain: [0, 306] });
    // append chart to dom
    (chart.value as HTMLElement).appendChild(curve.curve!)
})
</script>

<template>
    <div ref="chart"></div>
</template>