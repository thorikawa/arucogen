function generateMarkerSvg(width, height, bitsArray, col) {
	var num = bitsArray.length;
	var allWidth = col * (width + 2) + (col - 1) * 1;
	var row = Math.ceil(num / col);
	var allHeight = row * (height + 2) + (row - 1) * 1;
	var svg = $('<svg/>').attr({
		viewBox: '0 0 ' + allWidth + ' ' + allHeight,
		xmlns: 'http://www.w3.org/2000/svg',
		'shape-rendering': 'crispEdges' // disable anti-aliasing to avoid little gaps between rects
	});

	// Background rect
	for (var r = 0; r < row; r++) {
		for (var c = 0; c < col; c++) {
			var index = r * col + c;
			if (index >= num) {
				continue;
			}
			$('<rect/>').attr({
				x: c * (width + 2 + 1),
				y: r * (height + 2 + 1),
				width: width + 2,
				height: height + 2,
				fill: 'black'
			}).appendTo(svg);
		}
	}

	// "Pixels"
	for (var r = 0; r < row; r++) {
		for (var c = 0; c < col; c++) {
			var index = r * col + c;
			if (index >= num) {
				continue;
			}
			var bits = bitsArray[index];
			for (var i = 0; i < height; i++) {
				for (var j = 0; j < width; j++) {
					var color = bits[i * height + j] ? 'white' : 'black';
					var pixel = $('<rect/>').attr({
						width: 1,
						height: 1,
						x: c * (width + 2 + 1) + j + 1,
						y: r * (height + 2 + 1) + i + 1,
						fill: color
					});
					pixel.appendTo(svg);
				}
			}
		}
	}

	return svg;
}

var dict;

function generateArucoMarkers(width, height, dictName, ids, col) {
	console.log('Generate ArUco marker ' + dictName + ' ' + ids);

	var bitsArray = [];
	var bitsCount = width * height;

	// Parse marker's bytes
	for (var id of ids) {
		var bits = [];
		var bytes = dict[dictName][id];
		for (var byte of bytes) {
			var start = bitsCount - bits.length;
			for (var i = Math.min(7, start - 1); i >= 0; i--) {
				bits.push((byte >> i) & 1);
			}
		}
		bitsArray.push(bits);
	}

	return generateMarkerSvg(width, height, bitsArray, col);
}

var loadDict = $.getJSON('dict.json', function (data) {
	dict = data;
});

$(function () {
	var dictSelect = $('.setup select[name=dict]');
	var markerIdsInput = $('.setup input[name=ids]');
	var sizeInput = $('.setup input[name=size]');

	function updateMarker() {
		var markerIds = markerIdsInput.val().split(",").map((i) => Number(i));
		var size = Number(sizeInput.val());
		var col = 3;
		var num = markerIds.length;
		var row = Math.ceil(num / col);
		var dictName = dictSelect.val();
		var width = Number(dictSelect.find('option:selected').attr('data-width'));
		var height = Number(dictSelect.find('option:selected').attr('data-height'));

		// Wait until dict data is loaded
		loadDict.then(function () {
			// Generate marker
			var svg = generateArucoMarkers(width, height, dictName, markerIds, col);
			svg.attr({
				width: (size * col + 10 * (col - 1)) + 'mm',
				height: (size * row + 10 * (row - 1)) + 'mm'
			});
			$('.marker').html(svg[0].outerHTML);
			$('.save-button').attr({
				href: 'data:image/svg;base64,' + btoa(svg[0].outerHTML.replace('viewbox', 'viewBox')),
				download: dictName + '-' + markerIds.join("_") + '.svg'
			});
			$('.marker-id').html('ID ' + markerIds);
		})
	}

	updateMarker();

	dictSelect.change(updateMarker);
	$('.setup input').on('input', updateMarker);
});
