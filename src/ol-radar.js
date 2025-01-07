ol.control.Radar = class extends ol.control.Control {
    constructor(options) {

        const defaultOptions = {
            target: 'map',
            map: null,
            position: 'absolute',
            opacity: 0.6,
            zIndex: 3000,
            title: 'Radar',
            transitionMs: 1000
        }

        options = { ...defaultOptions, ...options };

        const element = document.createElement('div');
        element.className = 'ol-radar-control ol-control';
        element.style.opacity = options.opacity;
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.alignItems = 'flex-start';

        // 创建复选框和标题的容器
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.display = 'flex';
        checkboxContainer.style.alignItems = 'center'; // 垂直居中对齐

        // 创建复选框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'radarToggle';

        // 添加勾选事件
        checkbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                this.startAutoSlide(); // 启动计时器
            } else {
                this.stopAutoSlide(); // 停止计时器
            }
        });

        // 创建标题
        const title = document.createElement('label');
        title.htmlFor = 'radarToggle'; // 关联复选框
        title.innerText = options.title; // 使用options中的title

        // 将复选框和标题添加到容器中
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(title);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'ol-radar-timeSlider';
        slider.min = 0;
        slider.max = 9;
        slider.value = 0;
        slider.oninput = () => this.updateLayer();

        const olRadarTimestamp = document.createElement('span');
        olRadarTimestamp.id = 'ol-radar-timestamp';

        element.appendChild(checkboxContainer);
        element.appendChild(slider);
        element.appendChild(olRadarTimestamp);

        super({
            element: element,
            target: options.target
        });

        this.options = options;

        this.map = options.map;
        this.radarLayers = [];
        this.currentLayerIndex = 0;
        this.isRadarVisible = false;

        this.generateRadarLayers();
    }

    generateRadarLayers() {
        const TOTAL_INTERVALS = 10;
        const INTERVAL_LENGTH_HRS = 5;
        const currentTime = new Date();

        for (let i = 0; i <= TOTAL_INTERVALS; i++) {
            const timeDiffMins = TOTAL_INTERVALS * INTERVAL_LENGTH_HRS - INTERVAL_LENGTH_HRS * i;
            const layerRequest = `nexrad-n0q-m${timeDiffMins}m`; // 示例图层名称

            const layer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi',
                    params: { 'LAYERS': layerRequest, 'TILED': true },
                    serverType: 'geoserver'
                }),
                zIndex: this.options.zIndex
            });

            this.radarLayers.push({
                timestamp: new Date(currentTime.valueOf() - timeDiffMins * 60 * 1000).toLocaleTimeString(),
                layer: layer
            });
        }
    }

    toggleRadar() {
        this.isRadarVisible = document.getElementById('radarToggle').checked;
        if (this.isRadarVisible) {
            this.currentLayerIndex = 0;
            this.addLayer(this.radarLayers[this.currentLayerIndex].layer);
            this.updateTimestamp();
            this.startAutoSlide();
        } else {
            this.removeLayers();
            this.stopAutoSlide();
        }
    }

    startAutoSlide() {
        this.autoSlideInterval = setInterval(() => {
            this.currentLayerIndex = (this.currentLayerIndex + 1) % this.radarLayers.length;
            this.updateLayer();
        }, this.options.transitionMs);
    }

    stopAutoSlide() {
        clearInterval(this.autoSlideInterval);
    }

    addLayer(layer) {
        this.map.addLayer(layer);
    }

    removeLayers() {
        this.radarLayers.forEach(radarLayer => {
            this.map.removeLayer(radarLayer.layer);
        });
    }

    updateLayer() {
        this.removeLayers();
        this.addLayer(this.radarLayers[this.currentLayerIndex].layer);
        this.updateTimestamp();
        document.getElementById('ol-radar-timeSlider').value = this.currentLayerIndex;
    }

    updateTimestamp() {
        document.getElementById('ol-radar-timestamp').innerText = this.radarLayers[this.currentLayerIndex].timestamp;
    }
};