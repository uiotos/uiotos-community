## Reference

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E5%B7%A5%E5%85%B7%E5%A4%96%E8%A7%82.jpg)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E7%A4%BA%E4%BE%8B%E6%95%88%E6%9E%9C.png)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/CMCC.png)

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%8B%9B%E5%95%86%E7%A7%9F%E8%B5%81.gif)

## Release Notes
- **v1.0.301143** 
      
    initial

## Introduction
### What is UIOTOS?
A frontend no-code tool supporting **page nesting**, ready-to-use, where users do not need to understand code development or environment setup and can build IoT, back-end management, SCADA, HMI, and other GUI applications without any prior knowledge, going beyond mere visualization.
> Front-end development languages like JavaScript, C#, Qt, etc., UIOTOS users don't need any background in these.

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/aaa.gif)
    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E8%BF%9E%E7%BA%BF%E7%A4%BA%E4%BE%8B.gif)

<a name="Y8OBl"></a>
### Why was it created?
- **Even low-code requires some knowledge**

    Low-code tools still require basic development skills and minimal coding, which can be a barrier for users with backgrounds in backend development, algorithms, hardware, electrical engineering, product design, UI design, etc. With UIOTOS, you don't need to write a single line of code for common applications.
    > UIOTOS significantly lowers the user threshold so that even those without front-end coding experience can use it.

- **Limited functionality means upgrading components**

    Conventional tools heavily rely on built-in components and require frequent upgrades to meet various needs. UIOTOS supports page nesting, allowing users to combine and nest existing components to extend functionality. With the same number of components, UIOTOS can achieve an order of magnitude more uses compared to conventional tools.
    > UIOTOS doesn't completely depend on code extensions, achieving more with fewer components.
- **Interface development isn’t intuitive**

    Whether it's the Vue front-end framework, the amis low-code framework, or desktop frameworks like Qt, complex interfaces can be developed through code or JSON configuration, leading to nested components and incremental development. However, this can be abstract and unintuitive, especially when adding interface interactions. UIOTOS nesting and wiring are extremely intuitive.
    > UIOTOS is WYSIWYG (What You See Is What You Get), with prototypes directly translatable into applications, making the process clear and straightforward.
<a name="Tg2XA"></a>
### What are its highlights?
- **Containers support unlimited nesting levels, with no JSON configuration or code required.**

    Pages are nested through container components and support property inheritance, where properties of lower-level page components can be appended to the configuration of higher-level components.

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E9%A1%B5%E9%9D%A2%E5%B5%8C%E5%A5%97.gif)

- **Any complex JSON data can be set or parsed without code.**

    Wiring, configured with [parse string](https://www.yuque.com/liuhuo-nc809/uiotos/zl6xhi59n2xww3oq#KfdCR), can extract specific fields from arbitrarily complex structured JSON data.

    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%95%B0%E6%8D%AE%E6%97%A0%E4%BB%A3%E7%A0%81%E8%A7%A3%E6%9E%90.gif)

- **Existing web resources (like jQuery-based markdown) can be encapsulated as built-in components, eliminating the need to reinvent the wheel.**

    Components from frameworks like Element UI, amis, etc., can also be encapsulated for use with UIOTOS, for nesting and wiring.
    Configurations for nesting and wiring created with UIOTOS can be output in JSON format for use with other frameworks, enabling bidirectional compatibility.
    
    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/markdown%E7%BB%84%E4%BB%B6.png)

<a name="dXcPx"></a>
### Where is it applicable?

UIOTOS is not a "silver bullet" and has both suitable and less suitable scenarios. These are as follows:
- **Suitable Scenarios**

    Corporate application interfaces, including back-end management, IoT applications, SCADA systems, large-screen configurations, and industrial HMIs.
- **Less Suitable (but can be extended through custom development)**

    3D digital twins, mobile mini-apps, backend business logic, and specialized tools like documentation.
    
## About Community Edition 
- **Purpose of Open Source**

    The technology of **page nesting** (and **logical wiring**) has wide-ranging applications, such as flowcharts, prototyping, "PowerPoint," rule chains, interface development, and visual programming. UIOTOS is implemented using JavaScript and ht.js, and involves the following details about page nesting:

    - **Vertical**: 
    
        Supports unlimited nesting of pages.
    - **Horizontal**: 
    
        Each level can have multiple coexisting nested containers.
    - **Combined Vertical**: 
    
        A component can nest multiple pages (each of which can have arbitrary levels of nesting). For example, tabbed pages, tree-tables.
    - **Inheritance**: 
    
        Properties at any level can be inherited by upper levels and overwritten to modify their values.
    - **Bubble Up**: 
    
        Each layer runs independently and executes logic, and changes in property values bubble up layer by layer, triggering re-execution in upper layers.

    UIOTOS Community Edition provides the full code implementation for nesting, inheritance, and wiring, along with design concepts and implementation details, for developers to learn and reference. As a new technology, we welcome participation in joint development and maintenance.
- **Open Source Repository**: [GitHub-uiotos/uiotos-community](https://github.com/uiotos/uiotos-community)
- **Open Source License:** `Apache 2.0`
- **Core Code**
    - Common base components (`kernel/baseControls.js`)
    - Nesting and wiring engine (`kernel/iotosEngines.js`)
    - Commonly used functions (`kernel/iotosCommon.js`)
- **Technology Stack**
    - **Native JavaScript**

        No need to understand Vue, ES6, TypeScript, Webpack, or other frameworks or scaffolds.
    - **ht.js Graphics Library**

        To understand the implementation principles in-depth, some familiarity with ht.js is beneficial. For secondary development of components, this is not necessary. Components can be developed using other frameworks like jQuery or Vue based on the UIOTOS template.

<a name="yHLpL"></a>
## Getting Started
- **Step 1: Prepare the Environment**

    On Linux or Windows, <a href='https://url.nodejs.cn/download/'>install Node.js</a> (the latest version).
- **Step 2: Clone the Repository**

    ```
    git clone https://github.com/uiotos/uiotos-community.git
    ```
- **Step 3: Start the Service**

    Navigate to the `uiotos-community` directory and start the service with the following command: (On Windows, you can double-click run.bat to start.)
    ```
    node .\uiotos\server\server.js
    ```
    > Note: The file `.\uiotos\server\config.ini` can be used to change the server port.

   ![输入图片说明](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E6%97%A0%E4%BB%A3%E7%A0%81%E5%B9%B3%E5%8F%B0%E5%90%AF%E5%8A%A8.png)

- **Step 4: Open the Webpage**

    After starting the service, the browser will automatically open on Windows. If it doesn't, manually enter the server address and port, typically:
    ```
    http://localhost:8999
    ```
    > Note: It is recommended to use Google Chrome only.
    
    ![](https://gitee.com/uiotos/uiotos-community/raw/master/images/UIOTOS%E9%A6%96%E9%A1%B5.png)
        
<a name="dMCwf"></a>
## Usage

![](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E7%A4%BA%E4%BE%8B.jpg)

Demo: [203.189.6.3:8999（Fully）](http://203.189.6.3:8999/)  / [203.189.6.3:18999](http://203.189.6.3:18999/)

Document: [UIOTOS User Manual](https://www.yuque.com/liuhuo-nc809/uiotos)

Contact：![微信联系](https://gitee.com/uiotos/uiotos-community/raw/master/images/%E5%BE%AE%E4%BF%A1.png)