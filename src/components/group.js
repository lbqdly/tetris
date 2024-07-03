/**
 * Created by aaron on 2017/3/20.
 */
import config from './config'

const MODELS = [
  {
    name: "J",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 1, "1*1": 0, "2*1": 0, "3*1": 0,
      "0*2": 1, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "L",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 0, "1*1": 0, "2*1": 1, "3*1": 0,
      "0*2": 1, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "Z",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 1, "1*1": 1, "2*1": 0, "3*1": 0,
      "0*2": 0, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "S",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 0, "1*1": 0, "2*1": 1, "3*1": 1,
      "0*2": 0, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "O",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 0, "1*1": 1, "2*1": 1, "3*1": 0,
      "0*2": 0, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "T",
    state: {
      "0*0": 0, "1*0": 0, "2*0": 0, "3*0": 0,
      "0*1": 0, "1*1": 1, "2*1": 0, "3*1": 0,
      "0*2": 1, "1*2": 1, "2*2": 1, "3*2": 0,
      "0*3": 0, "1*3": 0, "2*3": 0, "3*3": 0,
    },
  },
  {
    name: "I",
    state: {
      "0*0": 0, "1*0": 1, "2*0": 0, "3*0": 0,
      "0*1": 0, "1*1": 1, "2*1": 0, "3*1": 0,
      "0*2": 0, "1*2": 1, "2*2": 0, "3*2": 0,
      "0*3": 0, "1*3": 1, "2*3": 0, "3*3": 0,
    },
  },
];

/**
 * 全部的名字
 * @returns {Array}
 */
export function allModelNames() {
  return MODELS.map((g) => g.name);
}

/**
 * 消除掉填满的行
 * @param arr
 * @param onCleanEveryLine
 * @returns {*[]|*}
 */
function cleanAndDecline(arr, onCleanEveryLine) {
  arr = uniqueArr(arr);

  //找出已经填满的行
  let fulls = [];
  let obj = {};
  for (let k in arr) {
    let row = parseKey(arr[k]).y;
    if (!obj[row]) {
      obj[row] = 1;
      //console.log('get one:', row);
    } else {
      obj[row] += 1;
      if (obj[row] >= config.COL) {
        fulls.push(row);
      }
    }
  }

  scroe = Math.pow(config.EACH_S, fulls.length);
  store.totalScore += scroe;
  //console.log(roundScroe);


  fulls.forEach(row => {
    //console.log('将消去行：', row);
    //消除
    arr = arr.filter(item => parseKey(item).y !== row);
    //下落
    arr = arr.map(v => {
      let locx = parseKey(v).x;
      let locy = parseKey(v).y;
      if (locy < parseInt(row)) {
        locy += 1;
        return locx + '*' + locy;
      } else {
        return v;
      }
    });
  });
  //console.log('本轮得分:', roundScroe);
  return arr;
}


/**
* 创建一个空白舞台数据。
* @returns {{}}
*/
export function createPureStage() {
  const state = {};
  for (let y = 0; y < config.ROW; y++) {
    for (let x = 0; x < config.COL; x++) {
      state[x + '*' + y] = 0;
    }
  }
  return state;
}




/**
 * 移动group
 * @param dir 方向
 * @param step 步数
 * @param fromTick 是否为常规下落
 */
function moveStep(dir = 'y', step = 1, fromTick = false) {
  //console.log(dir);
  if (!store.isIng) return;

  let gap = getEndGroupGap(activeGroup);


  if (dir === 'y') {

    if (gap === 0 && fromTick) {
      //结束
      //本轮结束
      completeRound();
    } else if (step >= gap) {
      //下底
      activeGroup = update(activeGroup, { y: { $apply: v => v + gap } });
    } else {
      //落n格
      activeGroup = update(activeGroup, { y: { $apply: v => v + step } });
    }

  }
  else if (dir === 'x') {
    activeGroup = update(activeGroup, { x: { $apply: v => v + step } });
    //修正一次
    activeGroup = correction(activeGroup, step > 0 ? 2 : 1);
  } else if (dir === 'o') {
    //旋转一次
    activeGroup = update(activeGroup, { state: { $apply: rotateState } });
    //修正一次
    activeGroup = correction(activeGroup, 0);
  }

  store.actives = groupToArray(activeGroup);

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
  let sArr = uniqueArr(store.stables);
  let cArr = [];//重叠的g

  //找出重叠的g,这里有优化的空间,可剪短sArr的长度
  Object.keys(group.state).forEach(key => {
    let realKey = parseKey(key, { x: group.x, y: group.y }).key;
    if (group.state[key] === 1) {
      if (parseKey(realKey).x < 0 || parseKey(realKey).x > config.COL - 1) {
        //超出左右
        //console.log('超出左右');
        cArr.push(parseKey(key).x);
      }
      sArr.forEach(sg => {
        if (realKey === sg) {
          //发生重叠
          cArr.push(parseKey(key).x);
        }
      })
    }
  });

  //修正到合适位置, 只有左、右需要修正，上下不需要.
  uniqueArr(cArr).forEach(x => {

    if (origin === 0) {
      //旋转后修复

      if (x < 2) {
        //这里的2是因为16个方块，从小于第2列开始是左方，以此类推
        //左边重叠,将右移
        console.log('修复左边');
        group.x += 1;
      }
      if (x > 1) {
        //右边重叠，将左移
        console.log('修复右边');
        group.x -= 1;
      }
    } else if (origin === 1) {

      //左右移动后修复
      if (x <= 2) {
        //这里的2是因为16个方块，从小于第2列开始是左方，以此类推
        //左边重叠,将右移
        console.log('修复左边');
        group.x += 1;
      }

    } else if (origin === 2) {

      if (x >= 1) {
        //右边重叠，将左移，I类型从1列开始
        console.log('修复右边');
        group.x -= 1;
      }
    }
  });

  return group;
}



/**
 * 获取最大可下落的距离
 * @param group
 * @returns {number}
 */
export function getEndGroupGap(group) {

  let arr = groupToArray(group);
  let minGap = config.ROW;
  let sArr = uniqueArr(store.stables);
  arr.forEach(a => {
    //取一个最小间隔
    if (config.ROW - parseKey(a).y < minGap) {
      minGap = config.ROW - parseKey(a).y;
    }
    //当底部还有其他稳定的方块
    sArr.forEach(s => {
      if (parseKey(a).x === parseKey(s).x && parseKey(s).y > parseKey(a).y && parseKey(s).y - parseKey(a).y < minGap) {
        minGap = parseKey(s).y - parseKey(a).y;
      }
    })
  });
  return minGap - 1;//去除重复后
}

export class Group {
  constructor(name) {
    //位置信息
    // 出生位置
    this.x = 3;
    this.y = -3;
    //显示状态

    if (name && allModelNames().indexOf(name) >= 0) {
      //指定的
      this.state = MODELS.find((n) => n.name === name).state;
      this.name = name;
    } else {
      //随机的
      let m = MODELS[Math.floor(MODELS.length * Math.random())];
      //console.log(m);
      this.state = m.state;
      this.name = m.name;
    }
  }
}


