;
app.import = (function() {
	function handleFileSelect(evt) {
		var f = evt.target.files[0];
		
		var reader = new FileReader();
		app.control.startLoading();
		reader.onload = (function(theFile) {
			return function(e) {
				var xml = $.parseXML(e.target.result);
				$("main").modeler("clear");
				app.import.bpmn.load(xml, api.model.create());
				$("main").modeler("updateLinks").modeler("updateModelName");
				app.helper.tree.rescan();
				app.control.endLoading();
			};
		})(f);
		
		reader.readAsText(f);
	}
	//$("#importfile").change(handleFileSelect);
}());