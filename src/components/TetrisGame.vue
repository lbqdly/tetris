<template>
  <div class="game">
    <!-- 面板部分 -->
    <div class="panel">
      <div></div>
      <i class="divide"></i>
      <div>得分：{{ totalScore }}</div>
      <b></b>
      <div>历史最佳：</div>
      <b></b>
      <i class="divide"></i>
      <button v-if="isIng" @click="gamePause()">暂停</button>
      <button v-else @click="gameContinue()">继续</button>
      <div class="btn-gap" />
      <button @click="gameReplay()">重新开始</button>
    </div>
    <!-- 舞台部分 -->
    <div ref="refStage" class="stage">
      <div class="row" v-for="(row, r) in stageDataForDom" :key="r">
        <Block
          v-for="(value, i) in row"
          :key="i"
          :size="config.SIZE"
          :value="value"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { reactive, computed, toRefs, ref, onMounted, watchEffect } from 'vue'
import config from './config'
import { createPureStage } from './group'
import Block from './Block.vue'
import { Group } from './group'
import Hammer from 'hammerjs'
import { uniqueArr } from '../utils'

export default {
  components: { Block },
  setup() {
    const readyList = [] // 准备中的组

    const store = reactive({
      //下落速度
      speed: config.SPEED,

      isIng: false, //是否进行中
      activeGroup: {}, // 当前正在运动的组

      //本轮得分
      scroe: 0,

      // 实心方块
      actives: [], //活动中的
      stables: [], //稳定的
      totalScore: 0, //总得分
      roundCount: 0,
      readyGroup: {},
    })
    const refStage = ref(null)
    // 当前舞台总方块数据
    const stageData = computed(() => {
      const pureStage = createPureStage()
      const arr = [...store.actives, ...store.stables]
      // 把所有实心块填入舞台
      arr.forEach((g) => {
        pureStage[g] = 1
      })
      return pureStage
    })
    // 舞台数据转化成二维数组结构，方便dom渲染
    const stageDataForDom = computed(() => {
      const table = []
      Object.keys(stageData.value).forEach((k) => {
        const [x, y] = k.split('*')
        if (!table[y]) {
          table[y] = []
        }
        table[y][x] = stageData.value[k]
      })
      return table
    })
    // 下一轮
    const nextDataForDom = computed(() => {
      const table = []
      return table
    })

    // watch(() => store.isIng, v => {
    // })
    /**
     * 重新开始
     */
    function gameReplay() {
      store.roundCount = 0 //总轮数清零
      store.totalScore = 0 //总得分清零
      store.stables = [] // 清空稳定的方块
      store.speed = config.SPEED // 重置速度
      gameContinue()
      // 新一轮
      newRound()
    }

    // 暂停游戏
    function gamePause() {
      store.isIng = false
    }
    // 继续游戏
    function gameContinue() {
      store.isIng = true
      tick()
    }

    /**
     * 设置新一轮数据
     */
    function newRound() {
      // 清空活动中的方块
      store.actives = []
      // 向预备列表中添加多个组，新一轮的时候，取前面一个
      while (readyList.length < 2) {
        readyList.push(new Group())
      }
      // 截取前面一个
      store.activeGroup = readyList.shift()
      store.readyGroup = readyList[0] //下一轮的组
      // 每完成一轮，间隔时间变短（每轮提升难度）
      if (store.speed > 0) {
        store.speed -= config.SPEED_A
      }
      // 总轮数加一
      store.roundCount += 1
      store.isIng = true
    }

    /**
     * 尝试修正到合适位置,修正成功则返回新的group
     * @param group
     * @param origin 来自旋转(0)/左边(1)/右边(2)
     * @returns {group}
     */
    function correction(group, origin = 0) {
      //稳定的g
      //将group与已经稳定的方块对比。
      //将超出左右和发生重叠的g的x值提出。
      let sArr = uniqueArr(store.stables)
      let cArr = [] //重叠的g

      //找出重叠的g,这里有优化的空间,可剪短sArr的长度
      Object.keys(group.state).forEach((key) => {
        let realKey = parseKey(key, { x: group.x, y: group.y }).key
        if (group.state[key] === 1) {
          if (parseKey(realKey).x < 0 || parseKey(realKey).x > config.COL - 1) {
            //超出左右
            //console.log('超出左右');
            cArr.push(parseKey(key).x)
          }
          sArr.forEach((sg) => {
            if (realKey === sg) {
              //发生重叠
              cArr.push(parseKey(key).x)
            }
          })
        }
      })

      //修正到合适位置, 只有左、右需要修正，上下不需要.
      uniqueArr(cArr).forEach((x) => {
        if (origin === 0) {
          //旋转后修复

          if (x < 2) {
            //这里的2是因为16个方块，从小于第2列开始是左方，以此类推
            //左边重叠,将右移
            console.log('修复左边')
            group.x += 1
          }
          if (x > 1) {
            //右边重叠，将左移
            console.log('修复右边')
            group.x -= 1
          }
        } else if (origin === 1) {
          //左右移动后修复
          if (x <= 2) {
            //这里的2是因为16个方块，从小于第2列开始是左方，以此类推
            //左边重叠,将右移
            console.log('修复左边')
            group.x += 1
          }
        } else if (origin === 2) {
          if (x >= 1) {
            //右边重叠，将左移，I类型从1列开始
            console.log('修复右边')
            group.x -= 1
          }
        }
      })

      return group
    }

    function tick() {
      moveStep('y', 1, true)
      if (store.isIng) setTimeout(tick, store.speed)
    }

    /**
     * 结束本轮
     */
    function completeRound() {
      //本轮结束，暂停tick。
      store.isIng = false

      //消去行后的稳定组
      store.stables = cleanAndDecline(store.stables.concat(store.actives))

      if (store.actives.some((item) => parseKey(item).y <= 0)) {
        console.log('触顶')
        gameOver()
      } else {
        console.log('新一轮')
        newRound()
      }
    }
    /**
     * 消除掉填满的行
     * @param arr
     * @param onCleanEveryLine
     * @returns {*[]|*}
     */
    function cleanAndDecline(arr, onCleanEveryLine) {
      arr = uniqueArr(arr)

      //找出已经填满的行
      let fulls = []
      let obj = {}
      for (let k in arr) {
        let row = parseKey(arr[k]).y
        if (!obj[row]) {
          obj[row] = 1
          //console.log('get one:', row);
        } else {
          obj[row] += 1
          if (obj[row] >= config.COL) {
            fulls.push(row)
          }
        }
      }

      store.scroe = Math.pow(config.EACH_S, fulls.length)
      store.totalScore += store.scroe
      //console.log(roundScroe);

      fulls.forEach((row) => {
        //console.log('将消去行：', row);
        //消除
        arr = arr.filter((item) => parseKey(item).y !== row)
        //下落
        arr = arr.map((v) => {
          let locx = parseKey(v).x
          let locy = parseKey(v).y
          if (locy < parseInt(row)) {
            locy += 1
            return locx + '*' + locy
          } else {
            return v
          }
        })
      })
      //console.log('本轮得分:', roundScroe);
      return arr
    }

    /**
     *
     */
    function gameOver() {
      console.log('game over !')
      alert('game over!')
      store.isIng = false
      //clearInterval(timer);
    }

    /**
     * 移动group
     * @param dir 方向
     * @param step 步数
     * @param fromTick 是否为常规下落
     */
    function moveStep(dir = 'y', step = 1, fromTick = false) {
      if (store.isIng === false) return
      // 计算出方块与底部的最小距离
      let gap = getEndGroupGap(store.activeGroup)
      console.log('gap:', gap)
      if (dir === 'y') {
        if (gap === 0 && fromTick) {
          //结束
          //本轮结束
          completeRound()
        } else if (step >= gap) {
          //下底
          store.activeGroup.y += gap
        } else {
          //落n格
          store.activeGroup.y += step
        }
      } else if (dir === 'x') {
        store.activeGroup.x += step
        //修正一次
        store.activeGroup = correction(store.activeGroup, step > 0 ? 2 : 1)
      } else if (dir === 'o') {
        //旋转一次
        store.activeGroup.state = rotateState(store.activeGroup.state)
        //修正一次
        store.activeGroup = correction(store.activeGroup, 0)
      }

      store.actives = groupToArray(store.activeGroup)
    }

    /**
     * 将state旋转90度,旋转以后判断是否超出了边界或重叠，整将坐标修正回边界以内。
     * @param state
     * @returns {{}}
     */
    function rotateState(state) {
      // 16格子旋转后
      let map = {
        '0*0': '3*0',
        '1*0': '3*1',
        '2*0': '3*2',
        '3*0': '3*3',
        '0*1': '2*0',
        '1*1': '2*1',
        '2*1': '2*2',
        '3*1': '2*3',
        '0*2': '1*0',
        '1*2': '1*1',
        '2*2': '1*2',
        '3*2': '1*3',
        '0*3': '0*0',
        '1*3': '0*1',
        '2*3': '0*2',
        '3*3': '0*3',
      }
      let nextState = {}
      for (let key in state) {
        nextState[map[key]] = state[key]
      }
      return nextState
    }

    /**
     * 筛选出所有实心块
     * @param group
     * @returns {Array}
     */
    function groupToArray(group) {
      const arr = []
      for (let key in group.state) {
        if (group.state[key] > 0) {
          let x = parseInt(key.split('*')[0])
          let y = parseInt(key.split('*')[1])
          x += group.x
          y += group.y
          arr.push(x + '*' + y)
        }
      }
      return arr
    }

    /**
     * 将key转换成坐标
     * @param key
     * @param offset 偏移量
     * @returns {{}}
     */
    function parseKey(key, offset) {
      offset = offset || { x: 0, y: 0 }
      let x = parseInt(key.split('*')[0]) + offset.x
      let y = parseInt(key.split('*')[1]) + offset.y
      return { x: x, y: y, key: x + '*' + y }
    }
    /**
     * 获取最大可下落的距离
     * @param group
     * @returns {number}
     */
    function getEndGroupGap(group) {
      const arr = groupToArray(group)
      let minGap = config.ROW
      let sArr = uniqueArr(store.stables)
      arr.forEach((a) => {
        //取一个最小间隔
        if (config.ROW - parseKey(a).y < minGap) {
          minGap = config.ROW - parseKey(a).y
        }
        //当底部还有其他稳定的方块
        sArr.forEach((s) => {
          if (
            parseKey(a).x === parseKey(s).x &&
            parseKey(s).y > parseKey(a).y &&
            parseKey(s).y - parseKey(a).y < minGap
          ) {
            minGap = parseKey(s).y - parseKey(a).y
          }
        })
      })
      return minGap - 1 //去除重复后
    }

    function addHammer() {
      let relaxTime = 0
      let mc = new Hammer(refStage.value)
      mc.get('pan').set({ direction: Hammer.DIRECTION_ALL })
      mc.on('tap panleft panright pandown', (e) => {
        //console.log('惯性:', e.deltaY < -100);
        if (e.type === 'tap') {
          moveStep('o')
          return
        }
        if (e.timeStamp - relaxTime < 150) {
          //衰减触发频率,控制在100毫秒以内
          return
        }
        if (e.additionalEvent === 'panright') {
          moveStep('x')
        } else if (e.additionalEvent === 'panleft') {
          moveStep('x', -1)
        } else if (e.additionalEvent === 'pandown') {
          moveStep('y')
        }
        relaxTime = e.timeStamp
      })
      mc.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL })
      mc.on('swipedown', (e) => {
        //console.log(e);
        //坠落到底
        moveStep('y', config.ROW, true, true)
      })
    }

    onMounted(() => {
      console.log(refStage)
      addHammer()
      gameReplay()
    })

    watchEffect(() => {
      console.log('isIng:', store.isIng)
      console.log('speed:', store.speed)
      console.log('roundCount:', store.roundCount)
    })

    return {
      ...toRefs(store),
      stageData,
      refStage,
      stageDataForDom,
      nextDataForDom,
      config,
      gamePause,
      gameContinue,
      gameReplay,
    }
  },
}
</script>
<style scoped>
.game {
  display: flex;
  padding: 5px;
  background: #e8e8e8;
  font-size: 14px;
  color: #333;
}
.panel {
  flex: auto;
  background: #fff;
  margin-right: 5px;
  padding: 5px;
}
.btn-gap {
  margin-bottom: 10px;
}
.stage {
}
.stage .row {
  display: flex;
}
.divide {
  display: block;
  height: 1px;
  background-color: #ddd;
  margin: 10px 0;
}
</style>
