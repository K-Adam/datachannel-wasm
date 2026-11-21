/**
 * Copyright (c) 2017-2022 Paul-Louis Ageneau
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
	var WebSocket = {
		$WEBSOCKET__deps: ['malloc', 'free', '$UTF8ToString', '$lengthBytesUTF8', '$stringToNewUTF8'],
		$WEBSOCKET: {
			map: {},
			nextId: 1,

			registerWebSocket: function(webSocket) {
				var ws = WEBSOCKET.nextId++;
				WEBSOCKET.map[ws] = webSocket;
				webSocket.binaryType = 'arraybuffer';
				return ws;
			},
		},

		wsCreateWebSocket: function(pUrl, pProtocols) {
			var url = UTF8ToString(pUrl);
			var protocols = UTF8ToString(pProtocols);
			if(!window.WebSocket) return 0;
			try {
				// Browsers reject an empty protocol name
				return WEBSOCKET.registerWebSocket(new WebSocket(url, protocols ? protocols.split(',') : []));
			} catch(err) {
				console.error(err);
				return 0;
			}
		},

		wsCloseWebSocket: function(ws) {
			var webSocket = WEBSOCKET.map[ws];
			if(!webSocket) return;
			webSocket.rtcUserClosed = true;
			webSocket.close();
		},

		wsDeleteWebSocket: function(ws) {
			var webSocket = WEBSOCKET.map[ws];
			if(webSocket) {
				webSocket.close();
				webSocket.rtcUserDeleted = true;
				delete WEBSOCKET.map[ws];
			}
		},

		wsSetOpenCallback: function(ws, openCallback) {
			if (!ws) return;
			var webSocket = WEBSOCKET.map[ws];
			var cb = function() {
				if(webSocket.rtcUserDeleted) return;
				var userPointer = webSocket.rtcUserPointer || 0;
				{{{ makeDynCall('vi', 'openCallback') }}} (userPointer);
			};
			webSocket.onopen = cb;
			if(webSocket.readyState == 1) setTimeout(cb, 0);
		},

 		wsSetErrorCallback: function(ws, errorCallback) {
			if (!ws) return;
			var webSocket = WEBSOCKET.map[ws];
			webSocket.rtcErrorCallback = errorCallback;
			// Browsers give no detail on error events, so the error is reported from the close event
			webSocket.onerror = function() {
				webSocket.rtcErrored = true;
			};
		},

		wsSetMessageCallback: function(ws, messageCallback) {
			if (!ws) return;
			var webSocket = WEBSOCKET.map[ws];
			webSocket.onmessage = function(evt) {
				if(webSocket.rtcUserDeleted) return;
				if(typeof evt.data == 'string') {
					var pStr = stringToNewUTF8(evt.data);
					var userPointer = webSocket.rtcUserPointer || 0;
					{{{ makeDynCall('viii', 'messageCallback') }}} (pStr, -1, userPointer);
					_free(pStr);
				} else {
					var byteArray = new Uint8Array(evt.data);
					var size = byteArray.byteLength;
					var pBuffer = _malloc(size);
					HEAPU8.set(byteArray, pBuffer);
					var userPointer = webSocket.rtcUserPointer || 0;
					{{{ makeDynCall('viii', 'messageCallback') }}} (pBuffer, size, userPointer);
					_free(pBuffer);
				}
			};
			webSocket.onclose = function(evt) {
				if(webSocket.rtcUserDeleted) return;
				var userPointer = webSocket.rtcUserPointer || 0;
				var errorCallback = webSocket.rtcErrorCallback;
				if(webSocket.rtcErrored && !webSocket.rtcUserClosed) {
					var reason = evt.reason ? ': ' + evt.reason : '';
					var pError = stringToNewUTF8('WebSocket closed with code ' + evt.code + reason);
					{{{ makeDynCall('vii', 'errorCallback') }}} (pError, userPointer);
					_free(pError);
					if(webSocket.rtcUserDeleted) return;
				}
				{{{ makeDynCall('viii', 'messageCallback') }}} (0, 0, userPointer);
			};
		},

		wsSendMessage: function(ws, pBuffer, size) {
			if (!ws) return -1;
			var webSocket = WEBSOCKET.map[ws];
			if(webSocket.readyState != 1) return -1;
			if(size >= 0) {
				var heapBytes = HEAPU8.subarray(pBuffer, pBuffer + size);
				if(heapBytes.buffer instanceof ArrayBuffer) {
					webSocket.send(heapBytes);
				} else {
					var byteArray = new Uint8Array(new ArrayBuffer(size));
					byteArray.set(heapBytes);
					webSocket.send(byteArray);
				}
				return size;
			} else {
				var str = UTF8ToString(pBuffer);
				webSocket.send(str);
				return lengthBytesUTF8(str);
			}
		},

		wsGetWebSocketUrl: function(ws) {
			if(!ws) return 0;
			var webSocket = WEBSOCKET.map[ws];
			var url = stringToNewUTF8(webSocket.url);
			// url should be freed later in c++.
			return url;
		},

		wsGetWebSocketState: function(ws) {
			if(!ws) return WebSocket.CLOSED;
			var webSocket = WEBSOCKET.map[ws];
			return webSocket.readyState;
		},

		wsSetUserPointer: function(ws, ptr) {
			var webSocket = WEBSOCKET.map[ws];
			if(webSocket) webSocket.rtcUserPointer = ptr;
		},
	};

	autoAddDeps(WebSocket, '$WEBSOCKET');
	mergeInto(LibraryManager.library, WebSocket);
})();

