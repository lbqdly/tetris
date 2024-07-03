<template>
  <div>
    <TetrisGame />
    <div>
      <h4>手机访问</h4>
      <img alt="手机访问" :src="qrcode" style="width: 100px; height: 100px" />
    </div>
  </div>
</template>
<script setup>
import TetrisGame from './components/TetrisGame.vue'
import qrcode from './assets/qrcode.png'
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
