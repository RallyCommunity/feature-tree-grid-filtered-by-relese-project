Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [
        {
            xtype: 'container',
            itemId: 'ProjectFilter'
        },
        {
            xtype: 'container',
            itemId: 'ReleaseFilter'
        },
        {
            xtype: 'container',
            itemId: 'buttonContainter'
        },
        {
           xtype: 'container',
           itemId: 'gridContainer'
        } 
        ],
    launch: function() {
        //decide how far back you want to go using LastUpdateDate of features:
        var millisecondsInDay = 86400000;            
        var currentDate = new Date();
        this._startDate = new Date(currentDate - millisecondsInDay*360).toISOString(); //go back one year
        
        this._createFilterBox('Project');
        this._createFilterBox('Release');
        this.down('#buttonContainter').add({
            xtype: 'rallybutton',
            text: 'Build TreeGrid',
            handler:  this._build,
            scope: this
        });
    },
    _createFilterBox: function(property){
        this.down('#'+property+'Filter').add({
            xtype: 'rallyfieldvaluecombobox',
            id: property +'Combobox',
            model: 'PortfolioItem/Feature',
            field: property,
            listeners: {
                ready: this._getFilter,
                select: this._getFilter,
                scope: this
            }
        });
    },
    
    _getFilter: function() {
        console.log('get filter');
        var filter = Ext.create('Rally.data.wsapi.Filter',{property: 'LastUpdateDate', operator: '>', value: this._startDate});
        filter=this._checkFilterStatus('Project',filter);
        filter=this._checkFilterStatus('Release',filter);
        this._filter = filter;  
    },
        
    _checkFilterStatus: function(property,filter){
        console.log('check status');
            var filterString=Ext.getCmp(property +'Combobox').getValue() +'';
            console.log(filterString);
            var filterArr=filterString.split(',');
            var propertyFilter=Ext.create('Rally.data.wsapi.Filter',{property: property, operator: '=', value: filterArr[0]});
            var i=1;
            while (i < filterArr.length){
                propertyFilter=propertyFilter.or({
                    property: property,
                    operator: '=',
                    value: filterArr[i]
                });
            i++;
        }
        filter=filter.and(propertyFilter);
        return filter;
    },
    
    _build:function(){
        console.log('build');
        var treeGrid = this.down('rallytreegrid');
        var that = this;
        if (treeGrid) {
            console.log('destroy');
            Ext.ComponentQuery.query('#gridContainer')[0].remove(Ext.ComponentQuery.query('#tree-grid')[0], true);
        }
            Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: ['portfolioitem/feature'],
            autoLoad: true,
            enableHierarchy: true,
            filters: that._filter
            }).then({
                success: this._onStoreBuilt,
                scope: this
            });
    },
    
    _onStoreBuilt: function(store) {
        console.log('on store built');
        this.down('#gridContainer').add({
            margin: '10px 0 0 0',
            xtype: 'rallytreegrid',
            itemId: 'tree-grid',
            width: 1000,
            store: store,
            context: this.getContext(),
            columnCfgs: [
                'Name',
                'State',
                'Project',
                'PercentDoneByStoryCount',
                'PercentDoneByStoryPlanEstimate',
                'ScheduleState',
                'PreliminaryEstimate'
            ]
        });
    }
});
