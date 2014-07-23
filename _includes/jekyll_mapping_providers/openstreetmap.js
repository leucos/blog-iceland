<script src="http://www.openlayers.org/api/OpenLayers.js"></script>
<script type="text/javascript">
var jekyllMapping = (function () {
    'use strict';
    var settings;
    var obj = {
        plotArray: function(locations) {
            function jekyllMapListen (m, s) {
                if (s.link) {
                    m.events.register('click', m, function() {
                        window.location.href = s.link;
                    });
                }
            }
            var s, l, m, bounds = new OpenLayers.Bounds();
            while (locations.length > 0) {
                s = locations.pop();
                l = new OpenLayers.LonLat(s.longitude, s.latitude).transform( new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
                m = new OpenLayers.Marker(l)
                this.markers.addMarker(m)
                bounds.extend(l);
                jekyllMapListen(m, s);
            }
            this.map.zoomToExtent(bounds)
        },
        indexMap: function () {
            this.plotArray(settings.pages);
        },
        pageToMap: function () {
            if (typeof(settings.latitude) !== 'undefined' && typeof(settings.longitude) !== 'undefined') {
                this.center = new OpenLayers.LonLat(settings.longitude, settings.latitude).transform( new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
                this.map.setCenter(this.center, settings.zoom);
                //this.markers.addMarker(new OpenLayers.Marker(this.center));
            }     

            if (settings.locations instanceof Array) {
                this.plotArray(settings.locations);
            }
            
            if (settings.layers) {
                while (settings.layers.length > 0){
                    var m = new OpenLayers.Layer.Vector("KML", {
                            strategies: [new OpenLayers.Strategy.Fixed()],
                            protocol: new OpenLayers.Protocol.HTTP({
                                url: this.siteurl + settings.layers.pop(),
                                format: new OpenLayers.Format.KML({
                                    extractStyles: true,
                                    extractAttributes: true,
                                    maxDepth: 2
                                })
                            })
                        });

                    this.map.addLayer(m)
                    
                    m.events.register('loadend', m, function(evt){
                        this.map.zoomToExtent(m.getDataExtent())
                    });

                    this.map.zoomToExtent(m.getDataExtent());
                    // console.log(bounds.getCenterLonLat());
                    // console.log(this.map.getCenterLonLat());

                    var highlightCtrl = new OpenLayers.Control.SelectFeature(m, {
                        hover: true,
                        highlightOnly: true,
                        renderIntent: "temporary",
                        eventListeners: {
                            // beforefeaturehighlighted: this.onFeatureHover,
                            featurehighlighted: this.onFeaturePreview,
                            featureunhighlighted: this.onFeatureUnpreview,
                        }
                    });
                    
                    var selectCtrl = new OpenLayers.Control.SelectFeature(m, {

                    });

                    m.events.on({
                        "featureselected": this.onFeatureSelect,
                        "featureunselected": this.onFeatureUnselect
                    });
                    this.map.addControl(highlightCtrl);
                    this.map.addControl(selectCtrl);
                    highlightCtrl.activate();                       
                    selectCtrl.activate();                       
                }
            }
        },
        mappingInitialize: function (set, siteurl) {
            settings = set;
            this.siteurl = siteurl;

            this.markers = new OpenLayers.Layer.Markers("Markers"),
            this.map = new OpenLayers.Map("jekyll-mapping");
            this.map.addLayer(new OpenLayers.Layer.OSM("OpenCycleMap",
              ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
               "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
               "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"])
            );
            this.map.addLayer(this.markers);

            if (settings.pages) {
                this.indexMap();
            } else {
                this.pageToMap();
            }
        },
        onFeatureHover: function(event) {

            var feature = event.feature;
            // Since KML is user-generated, do naive protection against
            // Javascript.
            var content = "<h2>"+feature.attributes.name + "</h2>" + feature.attributes.description;
            if (content.search("<script") != -1) {
                content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
            }
            var popup = new OpenLayers.Popup.FramedCloud("chicken", 
                                     feature.geometry.getBounds().getCenterLonLat(),
                                     new OpenLayers.Size(100,100),
                                     content,
                                     null, true, this.onPopupClose);
            feature.popup = popup;
            this.map.addPopup(popup);
        },
        onFeatureSelect: function(event) {
            console.log("onFeatureSelect");
            var feature = event.feature;

            // close hovering popup before
            if(feature.popup) {
                this.map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }

            // Since KML is user-generated, do naive protection against
            // Javascript.
            var content = "<h2>"+feature.attributes.name + "</h2>" + feature.attributes.description;
            if (content.search("<script") != -1) {
                content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
            }
            var popup = new OpenLayers.Popup.FramedCloud("refuge-detail", 
                                     feature.geometry.getBounds().getCenterLonLat(),
                                     new OpenLayers.Size(100,100),
                                     content,
                                     null, true, this.onPopupClose);
            feature.popup = popup;
            this.map.addPopup(popup);
        },        
        onFeatureUnselect: function(event) {
            var feature = event.feature;
            if(feature.popup) {
                this.map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }
        },
        onFeaturePreview: function(event) {
            console.log("onFeatureHover");

            var feature = event.feature;
            // Since KML is user-generated, do naive protection against
            // Javascript.
            var content = "<strong>"+ feature.attributes.name + "</strong>";

            var popup = new OpenLayers.Popup("refuge-overview", 
                                     feature.geometry.getBounds().getCenterLonLat(),
                                     new OpenLayers.Size(100,100),
                                     'Refuge de ' + feature.attributes.name,
                                     null, false, this.onPopupClose);
            popup.autoSize = true;
            feature.popup = popup;
            this.map.addPopup(popup);
        },        
        onFeatureUnpreview: function(event) {
            var feature = event.feature;
            if(feature.popup) {
                this.map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }
        },        
        onPopupClose: function(evt) {
            select.unselectAll();
        }        
    };
    return obj;
}());
</script>
