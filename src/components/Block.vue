<template>
  <div
    :style="{width: `${size}px`, height: `${size}px`}"
    class="g"
    :class="{ color: Boolean(value) }"
  ><slot/></div>
</template>

<script>
export default {
  props: {
    // 方块状态
    value: {
      type: Number,
    },
    // 方块大小
    size: {
      type: Number,
      default: 10,
    },
  },
}
</script>
<style scoped>
.g {
  display: block;
  margin: 1px;
  font-size: 10px;
  background-color: #dddddd;
}
.color {
  background-color: #ff9016;
}
</style>
