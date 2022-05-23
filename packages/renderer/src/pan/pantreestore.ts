import { defineStore } from 'pinia'
import { IAliGetDirModel } from '@/aliapi/alimodels'
import { h } from 'vue'
import PanDAL from './pandal'
import { ArrayToMap } from '@/utils/utils'
import { TreeNodeData } from '@/store/treestore'

export interface PanTreeState {
  user_id: string
  drive_id: string
  
  History: IAliGetDirModel[]
  
  selectDir: IAliGetDirModel
  
  selectDirPath: IAliGetDirModel[]
  
  treeData: TreeNodeData[]
  
  treeExpandedKeys: string[]
  
  treeSelectedKeys: string[]
  
  quickData: TreeNodeData[]
}
let treeDataMap = new Map<string, TreeNodeData>()
type State = PanTreeState

const fileiconfn = (icon: string) => h('i', { class: 'iconfont ' + icon })

const usePanTreeStore = defineStore('pantree', {
  state: (): State => ({
    user_id: '',
    drive_id: '',
    History: [],
    selectDir: {
      __v_skip: true,
      drive_id: '',
      file_id: '',
      parent_file_id: '',
      name: '',
      namesearch: '',
      size: 0,
      time: 0,
      description: ''
    },
    selectDirPath: [],
    treeData: [
      { __v_skip: true, title: '恢复文件', namesearch: '', key: 'recover', icon: () => fileiconfn('iconrecover'), isLeaf: true, children: [] },
      { __v_skip: true, title: '回收站', namesearch: '', key: 'trash', icon: () => fileiconfn('icondelete'), isLeaf: true, children: [] },
      { __v_skip: true, title: '收藏夹', namesearch: '', key: 'favorite', icon: () => fileiconfn('iconcrown'), isLeaf: true, children: [] },
      { __v_skip: true, title: '放映室', namesearch: '', key: 'video', icon: () => fileiconfn('iconrss_video'), isLeaf: true, children: [] },
      { __v_skip: true, title: '全盘搜索', namesearch: '', key: 'search', icon: () => fileiconfn('iconsearch'), isLeaf: true, children: [] },
      { __v_skip: true, title: '根目录', namesearch: '', key: 'root', children: [] }
    ],
    treeExpandedKeys: ['root'],
    treeSelectedKeys: [],
    quickData: []
  }),

  getters: {},

  actions: {
    mTreeSelected(key: string) {
      PanDAL.aShowDir('', key, true)
    },
    mTreeExpand(key: string) {
      let arr = this.treeExpandedKeys
      if (arr.includes(key)) {
        this.treeExpandedKeys = arr.filter((t) => t != key)
        if (this.selectDir.file_id != key) PanDAL.aShowDir('', key, false) 
      } else {
        this.treeExpandedKeys = arr.concat([key])
      }
    },
    mTreeExpandAll(keylist: string[], isExpaned: boolean) {
      let arr = new Set(this.treeExpandedKeys)
      let t = ''
      if (isExpaned) {
        for (let i = 0, maxi = keylist.length; i < maxi; i++) {
          arr.add(keylist[i])
        }
      } else {
        for (let i = 0, maxi = keylist.length; i < maxi; i++) {
          arr.delete(keylist[i])
        }
      }
      this.treeExpandedKeys = Array.from(arr)
    },
    
    mSaveUser(user_id: string, drive_id: string) {
      this.$reset()
      this.$patch({ user_id, drive_id })
    },
    
    mShowDir(dir: IAliGetDirModel, dirPath: IAliGetDirModel[], treeSelectedKeys: string[], treeExpandedKeys: string[]) {
      this.$patch({ selectDir: dir, selectDirPath: dirPath, treeSelectedKeys: treeSelectedKeys, treeExpandedKeys: treeExpandedKeys })
    },
    
    mSaveTreeAllNode(drive_id: string, root: TreeNodeData, rootmap: Map<string, TreeNodeData>) {
      if (this.drive_id !== drive_id) return

      let list: TreeNodeData[] = []
      for (let i = 0, maxi = this.treeData.length; i < maxi; i++) {
        if (this.treeData[i].key == root.key) {
          list.push(root)
        } else list.push(this.treeData[i])
      }

      this.treeData = list
      treeDataMap = rootmap
    },
    
    mSaveTreeOneDirNode(drive_id: string, dir_id: string, dirnode: TreeNodeData, dirmap: Map<string, TreeNodeData>) {
      console.log('刷新Tree', dirnode)
      if (this.drive_id !== drive_id) return

      
      const finddir = treeDataMap.get(dir_id)
      if (finddir) {
        finddir.children = dirnode.children
        let keys = dirmap.entries()
        for (let i = 0, maxi = dirmap.size; i < maxi; i++) {
          let key = keys.next().value
          treeDataMap.set(key[0], key[1])
        }
        this.treeData = this.treeData.concat()
      }
    },
    
    mRenameFiles(filelist: { file_id: string; parent_file_id: string; name: string; isdir: boolean }[]) {
      let isChange = false
      let isPath = false
      
      for (let i = 0, maxi = filelist.length; i < maxi; i++) {
        let item = filelist[i]
        if (!item.isdir) continue
        let findnode = treeDataMap.get(item.file_id)
        if (findnode) {
          findnode.title = item.name
          isChange = true
        }
        if (this.selectDir.file_id == item.file_id) {
          this.selectDir = Object.assign({}, this.selectDir, { name: item.name })
          isChange = true
        }
        
        this.selectDirPath.map((t) => {
          if (t.file_id == item.file_id) {
            t.name = item.name
            isPath = true
          }
        })
      }

      if (isChange) this.treeData = this.treeData.concat()
      if (isPath) this.selectDirPath = this.selectDirPath.concat()
    },
    mSaveQuick(list: { key: string; title: string }[]) {
      let nodelist: TreeNodeData[] = []
      for (let i = 0; i < list.length; i++) {
        nodelist.push({
          __v_skip: true,
          key: list[i].key,
          title: list[i].title || list[i].key,
          namesearch: i < 9 ? '快捷键 Ctrl+' + (i + 1) : '',
          children: [],
          isLeaf: true
        })
      }
      Object.freeze(nodelist)
      this.quickData = nodelist
    }
  }
})

export default usePanTreeStore
