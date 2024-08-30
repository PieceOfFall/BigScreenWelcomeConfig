<script setup lang="ts">
import { onMounted, reactive, toRefs, toRaw, ref } from "vue";
import { ElMessage, ElTable } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import Axios from "axios";
import type { Program, Programs } from "./types";

const programReactive = reactive<Programs>({
  active: "",
  programs: [],
});
const { active, programs } = toRefs(programReactive);
const multipleTableRef = ref<InstanceType<typeof ElTable>>();

let toOperateName: string[] = [];

const getFromHost = async () => {
  const ret = (
    await Axios.get<Programs>(`http://${import.meta.env.VITE_URL}/programs`)
  ).data;
  active.value = ret.active;
  programs.value = ret.programs;
};

onMounted(getFromHost);

function handleSelectionChange(selections: any[]) {
  toOperateName = selections.map((e) => toRaw(e)["name"]);
}

async function changeActive(selected: any) {
  active.value = toRaw(selected)["name"];
  await submit();
}

function newProgram() {
  isAdding.value = true;
  editedProgram.value = {
    name: "",
    text: [],
    duration: 0,
    color: "",
  };
}

function editProgram(selected: any) {
  const tmpProgram = toRaw(selected) as Program;
  editedName = tmpProgram.name;
  editedProgram.value = tmpProgram;

  isEditing.value = true;
}

async function deleteProgram() {
  if (toOperateName.includes(active.value)) {
    ElMessage({
      message: `节目《${active.value}》正在放映中`,
      type: "error",
    });
  } else {
    programs.value = programs.value.filter(
      (program) => !toOperateName.includes(program.name)
    );
  }
  toOperateName = [];
  multipleTableRef.value?.clearSelection();
  await submit();
}

const isEditing = ref<boolean>(false);
const isAdding = ref<boolean>(false);
let editedName: string = "";
const editedProgram = ref<Program>({
  name: "",
  text: [],
  duration: 0,
  color: "",
});

function addText() {
  editedProgram.value.text.push("");
}

function delText(delIndex: number) {
  editedProgram.value.text.splice(delIndex, 1);
}

async function confirmAdd() {
  programs.value.push(editedProgram.value);
  isAdding.value = false;
  isEditing.value = false;
  await submit();
}

async function confirmEdit() {
  programs.value = programs.value.map((e) =>
    e.name === editedName ? editedProgram.value : e
  );
  isAdding.value = false;
  isEditing.value = false;
  await submit();
}

async function submit() {
  const objToSubmit = toRaw(programReactive);
  const ret = await Axios.post(`http://${import.meta.env.VITE_URL}/set`, {
    ...objToSubmit,
  });
  if (ret.status === 201) {
    await getFromHost();
    ElMessage({
      message: `提交成功!`,
      type: "success",
    });
  } else {
    ElMessage({
      message: `提交失败，错误代码${ret.status}`,
      type: "error",
    });
  }
}
</script>

<template>
  <div id="main-container">
    <div id="main-box" class="--el-box-shadow-dark">
      <el-divider id="title" content-position="left" border-style="dashed">
        <b>欢迎大屏配置面板</b>
      </el-divider>

      <div id="stage-1" v-if="!(isEditing || isAdding)">
        <el-row id="operation-box">
          <el-col :span="2">
            <el-button size="large" @click="newProgram"> 新 建 </el-button>
          </el-col>
          <el-col :span="4">
            <el-button size="large" @click="deleteProgram"> 删 除 </el-button>
          </el-col>
        </el-row>

        <el-table
          id="table"
          ref="multipleTableRef"
          :data="programs"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="节目名称" prop="name" width="340">
            <template #default="nameScope">
              <div>
                {{ nameScope.row.name }}
                <div
                  style="color: lightgray"
                  v-if="active === nameScope.row.name"
                >
                  (放 映 中)
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="文字颜色" prop="color" width="340">
            <template #default="colorScope">
              <div :style="{ color: colorScope.row.color }">
                {{ colorScope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="切换时间 (秒)" prop="duration" width="183.75">
            <template #default="durationScope">
              {{ durationScope.row.duration / 1000 }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="340">
            <template #default="operationScope">
              <el-button @click="editProgram(operationScope.row)">
                编 辑
              </el-button>
              <el-button @click="changeActive(operationScope.row)">
                放 映
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button id="submit-button" type="primary" @click="submit"
          >提 交</el-button
        >
      </div>

      <div id="stage-2" v-if="isEditing || isAdding">
        <el-form v-model="editedProgram">
          <el-form-item label="节目名称">
            <el-input v-model="editedProgram.name" />
          </el-form-item>
          <el-form-item label="文字颜色">
            <el-input v-model="editedProgram.color" />
          </el-form-item>
          <el-form-item label="时间(毫秒)">
            <el-input v-model="editedProgram.duration" />
          </el-form-item>

          <el-divider></el-divider>
          <el-button type="primary" @click="addText"> <b> + </b> </el-button>
          <el-form-item
            :label="`内容${index + 1}`"
            v-for="(_item, index) in editedProgram.text"
          >
            <el-input v-model="editedProgram.text[index]">
              <template #append>
                <el-button :icon="Delete" circle @click="delText(index)" />
              </template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            @click="isAdding ? confirmAdd() : confirmEdit()"
            >确定</el-button
          >
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
#main-container {
  height: 100%;
  background-image: url("./bg.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;

  user-select: none;
  -webkit-user-select: none;

  #main-box {
    height: 100%;
    padding: 10px;

    border-radius: 15px;
    border-color: var(--el-border-color);
    background-color: rgb(255, 255, 255, 0.5);
    text-align: center;

    #title {
      margin: 35px;
    }

    #stage-1 {
      height: calc(100% - 71px);

      #operation-box {
        margin-top: 20px;
        margin-left: 55px;
      }
      #table {
        text-align: initial;
        padding: 0 55px 0 55px;
        margin-top: 20px;
        background-color: rgba($color: white, $alpha: 1);
      }
      #submit-button {
        margin-top: 10px;
      }
    }

    #stage-2 {
      margin: 0 30px;
      padding: 10px 30px;
      border-radius: 10px;
      border: 2px dashed lightgray;
      height: 470px;
      width: 800px;
      margin: auto;
      text-align: center;
      overflow: scroll;

      .el-form {
        text-align: left;
        margin: auto;
      }
    }
  }
}
</style>
