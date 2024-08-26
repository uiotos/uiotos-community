# UIOTOS 社区版 v1.0.301143
## 简介

### UIOTOS是什么？

一款支持**页面嵌套**的前端零代码工具，开箱即用，用户无需了解代码开发以及环境搭建，0基础可以搭建IoT、中后台管理、上位机、组态HMI等多类GUI界面应用，不止于可视化。
    
>前端开发语言JavaScript、C#、Qt等，UIOTOS用户不需要有任何基础。

<a name="Y8OBl"></a>
### 为什么要做？

- **代码再低，要会才行**

    低代码即便只需了解基础的开发技能和少量代码，对纯后端、算法、硬件、电气，以及产品、UI等用户而言，都有天然鸿沟。常规应用，UIOTOS无需一行代码，也能轻松实现。
    > UIOTOS用于极大降低用户门槛，不懂前端代码也能用。

- **缺少功能就得升级组件**

    常规工具过度依赖于内置组件，需要升级提供尽可能多的，以满足各种需求。UIOTOS支持页面嵌套，用户可以对已有组件组合、嵌套，扩展功能。同等数量的组件，UIOTOS能比常规工具，多出一个数量级的用途。
    > UIOTOS不完全依赖代码扩展，更少组件实现更多功能。

- **交互界面开发不直观**

    不论是vue前端框架，还是amis低代码框架、Qt等桌面框架，复杂界面都能通过代码或者JSON配置，实现组件嵌套、增量化开发。但是较为抽象，不直观。再带上界面交互更是如此。UIOTOS的嵌套和连线极为直观。
    > UIOTOS所见即所得，原型即应用，过程直观不抽象。

<a name="Tg2XA"></a>
### 有何亮点？
- **容器支持无限级嵌套，界面操作即可，无需任何JSON配置和代码。** 

    页面之间通过容器组件嵌套，并支持属性继承，即将下层页面组件的属性，追加到上层去配置使用。

    ![20240818090511_rec_.gif](https://cdn.nlark.com/yuque/0/2024/gif/534201/1723943130131-26df2006-dda3-4765-b0f1-178c746b6b4a.gif#averageHue=%23254f77&clientId=u45b29602-a075-4&from=paste&height=700&id=ud99f4398&originHeight=700&originWidth=1284&originalType=binary&ratio=1&rotation=0&showTitle=false&size=633055&status=done&style=none&taskId=uccd3a0a3-41af-4c79-a0d5-6117cb06740&title=&width=1284)

- **任意复杂的JSON数据，不论是设置值，还是解析提取值，都无需代码。**

    连线，配置上[解析字符串](https://www.yuque.com/liuhuo-nc809/uiotos/zl6xhi59n2xww3oq#KfdCR)，就能提取任意复杂结构JSON数据的指定字段值。

    ![](https://cdn.nlark.com/yuque/0/2024/gif/39161281/1723174280678-4a385b23-234e-4a2e-8256-2ec8e9aff652.gif#averageHue=%23dbdce8&from=url&id=pAOsb&originHeight=1032&originWidth=2010&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)<br />参见[示例8：数据的解析提取。](https://www.yuque.com/liuhuo-nc809/uiotos/yg8bvqzv5fw2kkty)

- **现有的WEB资源（比如基于jquery的markdown），都能封装成内置组件，无需造轮子。**
 
    element-ui、amis等代码或低代码框架，组件也能封装给UIOTOS用，用于嵌套、连线。
UIOTOS编辑的嵌套、连线配置，也能以JSON形式输出，给其他框架使用，双向配合。

    ![image.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1723943543193-e9bb22ed-ee38-4421-9d52-f51a295c03f6.png#averageHue=%23839f91&clientId=u45b29602-a075-4&from=paste&height=962&id=RrGED&originHeight=962&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=214392&status=done&style=none&taskId=u70c25ddb-6ee6-4ea0-a896-392d636cba8&title=&width=1920)
    
<a name="dXcPx"></a>
### 适用在哪？
UIOTOS不是`“银弹”`，有适用的和暂不适用的场景。分别如下：

- 适用场景

    企业应用交互界面，包括`中后台管理`、`IoT物联网应用`、`上位机`、`大屏组态`及`工业HMI`等。

- 暂不适用（可二次开发）

    3D数字孪生、移动端小程序、后端业务逻辑、文档等专业工具。

## 关于
- **开源目的**

    `**页面嵌套**`技术（以及`**逻辑连线**`）用途十分广泛，可用于流程图、原型设计、“PPT”、规则链，以及界面开发、可视化编程等。UIOTOS基于JavaScript和ht.js实现，涉及页面嵌套的各方面细节，列举如下：
    > - 纵向：支持无限层任意页面嵌套。
    > - 横向：每一层页面，可以并存多个嵌套容器。
    > - 合纵：一个组件可以嵌套多个页面（各自分别可以有任意层嵌套）。比如tab页签、treeTable表格。
    > - 继承：任意层嵌套，属性都可以被上层继承，重写修改属性值。
    > - 冒泡：每层各自独立运行、执行逻辑，属性值的变化，逐层向上冒泡，触发上一层再执行。

    UIOTOS社区版开放了嵌套、继承、连线的全部代码实现，设计思路和实现细节，供开发者学习和参考。作为一项新创的技术，也欢迎参与共同开发维护。

- **开源地址**

    [GitHub-uiotos/uiotos-community](https://github.com/uiotos/uiotos-community)

- **开源协议：**`Apache 2.0`
- **核心代码**
   - 常见的基础组件（`kernel/baseControls.js`）
   - 嵌套、连线引擎（`kernel/iotosEngines.js`）
   - 依赖的公共函数（`kernel/iotosCommon.js`）
- **技术栈**
   - **原生JavaScript**

        无需了解vue、es6、typescript、webpack等框架或脚手架。

    - **ht.js图形库**

        更深入了解代码实现原理，需对ht.js有一定的了解。<br />二次开发组件则不是必需。基于UIOTOS框架模板，使用jquery、vue等其他框架开发即可。

- **版本对照**

    | 版本 | **社区版**<br />（当前） | **商业版** |  |  |
    | --- | --- | --- | --- | --- |
    |  |  | 高级版 | 专业版 | SaaS版 |
    | 功能 | 基础组件和连线、嵌套、小示例 | 高级组件和素材、完整实践示例、编辑自定义、调试诊断... |  |  |
    | 商用 | 开源免费遵循Apache2.0协议 | VIP会员、商用授权、完整源码。 |  |  |
    | | | | |  |

<a name="yHLpL"></a>
## 启动

- **步骤一：环境准备**

    Linux或Windows下，安装Node.js（最新版即可）。

- **步骤二：拉取代码**
    ```
    git clone https://github.com/uiotos/uiotos-community.git
    ```

- **步骤三：启动服务**

    进入`uiotos-community`目录，以下命令启动服务：（window下可直接双击运行run.bat启动）
    ```
    node .\uiotos\server\server.js
    ```
    > 注意：文件`.\uiotos\server\config.ini`，可修改服务端口 。

    ![QQ_1724642731270.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1724642735280-13a61a1c-9ff3-4e7e-b8a4-938b42bdf850.png#averageHue=%231a1a1a&clientId=u85ea386b-53e0-4&from=paste&height=103&id=cyHkC&originHeight=103&originWidth=539&originalType=binary&ratio=1&rotation=0&showTitle=false&size=7295&status=done&style=none&taskId=u308daf2a-df88-4119-a89b-e568a61f165&title=&width=539)

- **步骤四：打开网页**

    启动服务后，windows下会自动打开浏览器。如果没有，可手动输入`服务器地址:端口`打开，通常为：
    ```
    http://localhost:8999
    ```
    > 注意：建议仅使用谷歌Chrome浏览器。	

    ![QQ_1724643190065.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1724643199068-586f6e9b-84ba-4313-be24-17b10432e10d.png#averageHue=%23313843&clientId=u85ea386b-53e0-4&from=paste&height=1050&id=ucab9e6ba&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=294822&status=done&style=none&taskId=u968ff92a-5b11-4656-9e75-39e9fca4906&title=&width=1920)
<a name="dMCwf"></a>
## 使用

参见[UIOTOS帮助手册](https://www.yuque.com/liuhuo-nc809/uiotos?#%20%E3%80%8AUIOTOS%E3%80%8B)。

