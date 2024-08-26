# UIOTOS Community Edition v1.0.301143
## Introduction
### What is UIOTOS?
A frontend no-code tool supporting **page nesting**, ready-to-use, where users do not need to understand code development or environment setup and can build IoT, back-end management, SCADA, HMI, and other GUI applications without any prior knowledge, going beyond mere visualization.
> Front-end development languages like JavaScript, C#, Qt, etc., UIOTOS users don't need any background in these.
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

    ![20240818090511_rec_.gif](https://cdn.nlark.com/yuque/0/2024/gif/534201/1723943130131-26df2006-dda3-4765-b0f1-178c746b6b4a.gif#averageHue=%23254f77&clientId=u45b29602-a075-4&from=paste&height=700&id=ud99f4398&originHeight=700&originWidth=1284&originalType=binary&ratio=1&rotation=0&showTitle=false&size=633055&status=done&style=none&taskId=uccd3a0a3-41af-4c79-a0d5-6117cb06740&title=&width=1284)

- **Any complex JSON data can be set or parsed without code.**

    Wiring, configured with [parse string](https://www.yuque.com/liuhuo-nc809/uiotos/zl6xhi59n2xww3oq#KfdCR), can extract specific fields from arbitrarily complex structured JSON data.

    ![](https://cdn.nlark.com/yuque/0/2024/gif/39161281/1723174280678-4a385b23-234e-4a2e-8256-2ec8e9aff652.gif#averageHue=%23dbdce8&from=url&id=pAOsb&originHeight=1032&originWidth=2010&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)<br />See [Example 8: Data Parsing and Extraction.](https://www.yuque.com/liuhuo-nc809/uiotos/yg8bvqzv5fw2kkty)

- **Existing web resources (like jQuery-based markdown) can be encapsulated as built-in components, eliminating the need to reinvent the wheel.**

    Components from frameworks like Element UI, amis, etc., can also be encapsulated for use with UIOTOS, for nesting and wiring.
    Configurations for nesting and wiring created with UIOTOS can be output in JSON format for use with other frameworks, enabling bidirectional compatibility.
    
    ![image.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1723943543193-e9bb22ed-ee38-4421-9d52-f51a295c03f6.png#averageHue=%23839f91&clientId=u45b29602-a075-4&from=paste&height=962&id=RrGED&originHeight=962&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=214392&status=done&style=none&taskId=u70c25ddb-6ee6-4ea0-a896-392d636cba8&title=&width=1920)
<a name="dXcPx"></a>
### Where is it applicable?

UIOTOS is not a "silver bullet" and has both suitable and less suitable scenarios. These are as follows:
- **Suitable Scenarios**

    Corporate application interfaces, including back-end management, IoT applications, SCADA systems, large-screen configurations, and industrial HMIs.
- **Less Suitable (but can be extended through custom development)**

    3D digital twins, mobile mini-apps, backend business logic, and specialized tools like documentation.
## About
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
- **Version Comparison**

    | Version | **Community Edition**<br />(Current) | **Commercial Edition** | **...**| **...**|
    | --- | --- | --- | --- | --- |
    | | | **Advanced Edition** | **Professional Edition** | **SaaS Edition** |
    | Features | Basic components and wiring, nesting, small examples | Advanced components and materials, complete practical examples, editor customization, debugging diagnostics... | | |
    | Commercial Use | Open-source and free under Apache 2.0 license | VIP membership, commercial licensing, full source code. | | |

<a name="yHLpL"></a>
## Getting Started
- **Step 1: Prepare the Environment**

    On Linux or Windows, install Node.js (the latest version).
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
    ![QQ_1724642731270.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1724642735280-13a61a1c-9ff3-4e7e-b8a4-938b42bdf850.png#averageHue=%231a1a1a&clientId=u85ea386b-53e0-4&from=paste&height=103&id=cyHkC&originHeight=103&originWidth=539&originalType=binary&ratio=1&rotation=0&showTitle=false&size=7295&status=done&style=none&taskId=u308daf2a-df88-4119-a89b-e568a61f165&title=&width=539)

- **Step 4: Open the Webpage**

    After starting the service, the browser will automatically open on Windows. If it doesn't, manually enter the server address and port, typically:
    ```
    http://localhost:8999
    ```
    > Note: It is recommended to use Google Chrome only.
    
    ![QQ_1724643190065.png](https://cdn.nlark.com/yuque/0/2024/png/534201/1724643199068-586f6e9b-84ba-4313-be24-17b10432e10d.png#averageHue=%23313843&clientId=u85ea386b-53e0-4&from=paste&height=1050&id=ucab9e6ba&originHeight=1050&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&size=294822&status=done&style=none&taskId=u968ff92a-5b11-4656-9e75-39e9fca4906&title=&width=1920)
<a name="dMCwf"></a>
## Usage

Refer to the [UIOTOS User Manual](https://www.yuque.com/liuhuo-nc809/uiotos)