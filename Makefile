
update_js_templates:
	python vendors/jquery.mustache/src/generate_templates.py -l fr -d src/static/js/ms_templates -o src/static/js

skip:
	python vendors/jquery.mustache/src/generate_templates.py -l fr -d src/static/js/ms_templates -o src/static/js -s
