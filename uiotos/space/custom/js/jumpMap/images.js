ht.Default.setImage('mapText', {
    width: 200,
    height: 50,
    comps: [
        {
            type: 'text',
            relative: true,
            rect:[0, 0, 1, 1],
            text: { func: 'style@text', value: '' },            
            align: { func: 'style@text.align', value: 'center' },
            vAlign: { func: 'style@text.vAlign', value: 'middle' },
            color: { func: 'style@text.color', value: 'black' },
            font: { func: 'style@text.font', value: '12px arial, sans-serif' },
            shadow: { func: 'style@text.shadow' },
            shadowColor: { func: 'style@text.shadow.color' },
            shadowBlur: { func: 'style@text.shadow.blur' },
            shadowOffsetX: { func: 'style@text.shadow.offset.x' },
            shadowOffsetY: { func: 'style@text.shadow.offset.y' },           
        }
    ]
});