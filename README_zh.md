## 参考

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E5%B7%A5%E5%85%B7%E5%A4%96%E8%A7%82.jpg)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E7%A4%BA%E4%BE%8B%E6%95%88%E6%9E%9C.png)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/CMCC.png)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%8B%9B%E5%95%86%E7%A7%9F%E8%B5%81.gif)

## 更新

- **v1.0.301143** 
      
    初始发布。

## 简介

### UIOTOS是什么？

一款支持**页面嵌套**的前端零代码工具，开箱即用，用户无需了解代码开发以及环境搭建，0基础可以搭建IoT、中后台管理、上位机、组态HMI等多类GUI界面应用，不止于可视化。
    
>前端开发语言JavaScript、C#、Qt等，UIOTOS用户不需要有任何基础。

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/aaa.gif)
    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E8%BF%9E%E7%BA%BF%E7%A4%BA%E4%BE%8B.gif)

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

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E9%A1%B5%E9%9D%A2%E5%B5%8C%E5%A5%97.gif)

- **任意复杂的JSON数据，不论是设置值，还是解析提取值，都无需代码。**

    连线配置上[解析字符串](https://www.yuque.com/liuhuo-nc809/uiotos/zl6xhi59n2xww3oq#KfdCR)，就能提取任意复杂结构JSON数据的指定字段值。

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%95%B0%E6%8D%AE%E6%97%A0%E4%BB%A3%E7%A0%81%E8

     参见[示例8：数据的解析提取。](https://www.yuque.com/liuhuo-nc809/uiotos/yg8bvqzv5fw2kkty)

- **现有的WEB资源（比如基于jquery的markdown），都能封装成内置组件，无需造轮子。**
 
    element-ui、amis等代码或低代码框架，组件也能封装给UIOTOS用，用于嵌套、连线。
UIOTOS编辑的嵌套、连线配置，也能以JSON形式输出，给其他框架使用，双向配合。

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/markdown%E7%BB%84%E4%BB%B6.png)
    
<a name="dXcPx"></a>
### 适用在哪？
UIOTOS不是`“银弹”`，有适用的和暂不适用的场景。分别如下：

- 适用场景

    企业应用交互界面，包括`中后台管理`、`IoT物联网应用`、`上位机`、`大屏组态`及`工业HMI`等。

- 暂不适用（可二次开发）

    3D数字孪生、移动端小程序、后端业务逻辑、文档等专业工具。

## 关于社区版
- **开源目的**

    **页面嵌套**技术（以及**逻辑连线**）用途十分广泛，可用于流程图、原型设计、“PPT”、规则链，以及界面开发、可视化编程等。UIOTOS基于JavaScript和ht.js实现，涉及页面嵌套的各方面细节，列举如下：
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

    | 版本 | **社区版（当前）** | **商业版** |
    | --- | --- | --- |
    | 功能 | 基础组件和连线、嵌套、小示例 | 高级组件和素材、完整实践示例、编辑自定义、调试诊断... |
    | 商用 | 开源免费遵循Apache2.0协议 | VIP会员、商用授权、高级功能源码等。 | 

<a name="yHLpL"></a>
## 启动

- **步骤一：环境准备**

    Linux或Windows下，<a href='https://url.nodejs.cn/download/'>安装Node.js</a>（最新版即可）。

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

    
    ![输入图片说明](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%97%A0%E4%BB%A3%E7%A0%81%E5%B9%B3%E5%8F%B0%E5%90%AF%E5%8A%A8.png)

- **步骤四：打开网页**

    启动服务后，windows下会自动打开浏览器。如果没有，可手动输入`服务器地址:端口`打开，通常为：
    ```
    http://localhost:8999
    ```
    > 注意：建议仅使用谷歌Chrome浏览器。	

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/UIOTOS%E9%A6%96%E9%A1%B5.png)

<a name="dMCwf"></a>
## 使用

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E7%A4%BA%E4%BE%8B.jpg)

演示地址：[203.189.6.3:8999（完整）](http://203.189.6.3:8999/)  / [203.189.6.3:18999](http://203.189.6.3:18999/)

参见文档：[UIOTOS帮助手册](https://www.yuque.com/liuhuo-nc809/uiotos?#%20%E3%80%8AUIOTOS%E3%80%8B)

微信联系：![微信联系](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E5%BE%AE%E4%BF%A1.png)