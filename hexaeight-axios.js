import axios from "axios";
import xhook from "xhook";
import qs from "qs";

xhook.after(function (request, response) {
  if (response.headers["provider"] == "HexaEight-Encrypted") {
    try {
      if (request.headers.rType != "") {
        response.responseType = request.headers.rType;
      }
    } catch {}
  }
});

const axiosHexaEightInstance = axios.create();

async function retryOperationWithExponentialDelay(operation, maxRetries) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const result = await operation();
      if (!result) {
        // Result is empty, retry the operation with exponential delay
        const delay = retries * 3000; // Exponential delay in milliseconds
        retries++;

        // Wait for the specified delay before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        return result; // Operation succeeded, return the result
      }
    } catch (error) {
      if (error.message.includes("ERROR")) {
        // Retry the operation with exponential delay
        const delay = retries * 3000; // Exponential delay in milliseconds
        retries++;

        // Wait for the specified delay before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Operation failed for a different reason, propagate the error
        throw error;
      }
    }
  }
  // If maxRetries is reached, throw an error
  throw new Error("Max retries reached");
}

axiosHexaEightInstance.interceptors.request.use(
  async (request) => {
    const finalurl =
      request.params && Object.keys(request.params).length
        ? `${request.url}?${qs.stringify(request.params)}`
        : `${request.url}`;
    //console.log(finalurl.toString());
    try {
      delete request.params;
    } catch {}

    const destination = await retryOperationWithExponentialDelay(async () => {
      return await window.auth.user.HexaEight.FetchDestination(
        window.name,
        finalurl.toString()
      );
    }, 2); // Retry up to 2 times

    //const destination = await window.auth.user.HexaEight.FetchDestination(window.name,finalurl.toString());

    let encryptedData;
    let encryptedurl;

    if (request.method != "get") {
      if (typeof request.data === "string") {
        // If request.data is a string, continue with the existing logic
        const dataRequest = new Blob([request.data], { type: "text/plain" });
        const dataToEncrypt = new Uint8Array(await dataRequest.arrayBuffer());
        request.data = dataToEncrypt; // Assign dataToEncrypt to request.data
      } else if (typeof request.data === "object") {
        if (request.data instanceof ArrayBuffer) {
          // If request.data is already an ArrayBuffer, assign it directly
          request.data = new Uint8Array(request.data);
        } else if (request.data instanceof Blob) {
          // If request.data is a Blob, convert it to ArrayBuffer and then to Uint8Array
          const dataToEncrypt = new Uint8Array(
            await request.data.arrayBuffer()
          );
          request.data = dataToEncrypt;
        } else if (request.data instanceof FormData) {
          // If request.data is FormData, create a new Blob and convert to ArrayBuffer
          const blobData = new Blob([request.data], {
            type: "multipart/form-data",
          });
          const dataToEncrypt = new Uint8Array(await blobData.arrayBuffer());
          request.data = dataToEncrypt;
        } else {
          // If request.data is an object (likely JSON), stringify it
          const jsonString = JSON.stringify(request.data);
          const dataToEncrypt = new Uint8Array(
            new TextEncoder().encode(jsonString)
          );
          request.data = dataToEncrypt; // Assign dataToEncrypt to request.data
        }
      } else if (request.data instanceof Blob) {
        const dataToEncrypt = new Uint8Array(await request.data.arrayBuffer());
        request.data = dataToEncrypt; // Assign dataToEncrypt to request.data
      } else if (request.data instanceof XMLHttpRequest) {
        const xhr = request.data;
        xhr.responseType = "arraybuffer";
        await new Promise((resolve) => {
          xhr.onload = () => resolve();
          xhr.send();
        });
        request.data = new Uint8Array(xhr.response);
      }
    }

      if (!encryptedData && request.method != "get") {
        try {
          encryptedData = await window.auth.user.HexaEight.EncryptBytesAsync(
            window.name,
            destination,
            request.data
          );	
	  request.data = encryptedData;
          request.headers.Authorization = "Bearer HexaEight-Fast";
        } catch {
          encryptedData = await window.auth.user.HexaEight.EncryptBytes(
            window.name,
            destination,
            request.data
          );

	  request.data = encryptedData;
          request.headers.Authorization = "Bearer HexaEight";
        }
      }
      if (!encryptedurl) {
        encryptedurl = await window.auth.user.HexaEight.encrypturl(
          window.name,
          finalurl.toString()
        );
      }

      if (encryptedurl.length > 0) {
        if (request.method == "get") {
          request.headers.Authorization = "Bearer HexaEight";
        }

        //request.headers.Authorization = "Bearer HexaEight";
        request.headers.rType = request.responseType;
        request.originalresponseType = request.responseType;
        request.responseType = "arraybuffer";
        if (request.transitional) {
          request.transitional.silentJSONParsing = false;
          request.transitional.forcedJSONParsing = false;
        }
        request.url = encryptedurl;
        //console.log(encryptedurl);

        if (encryptedData === "" && request.method != "get") {
          await window.auth.user.HexaEight.ClearDestination(
            window.name,
            finalurl.toString()
          );
          await window.auth.user.HexaEight.ClearDestinationURL(
            finalurl.toString()
          );
          return Promise.reject(
            "Error: Unable to encrypt request. Retry Operation"
          );
          request.data = encryptedData;
        }

        return request;

      //}

    } else {

      await window.auth.user.HexaEight.ClearDestination(
        window.name,
        finalurl.toString()
      );
      await window.auth.user.HexaEight.ClearDestinationURL(finalurl.toString());
      return Promise.reject("Error: Unable to encrypt URL. Retry Operation");
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosHexaEightInstance.interceptors.response.use(
  async (response) => {
    if (response.status !== 200) {
      await window.auth.user.HexaEight.ClearDestination(
        window.name,
        response.config.url
      );
      await window.auth.user.HexaEight.ClearDestinationURL(response.config.url);

      // Modify the response message
      response.data = "ERROR:" + response.status + response.statusText;
    }
    if (
      response.headers["provider"] == "HexaEight-Encrypted" &&
      response.status === 200
    ) {
      const destination = await window.auth.user.HexaEight.FetchDestination(
        window.name,
        response.request.responseURL.toString()
      );

      let decrypteddata = await window.auth.user.HexaEight.DecryptBytesAsync(
        window.name,
        destination,
        new Uint8Array(response.data)
      );

      if (decrypteddata == null) {
	      decrypteddata = await window.auth.user.HexaEight.DecryptBytes(
        	window.name,
	        destination,
        	new Uint8Array(response.data)
      	      );
	      //response.data = decrypteddata;
      } else {
	if (decrypteddata.byteLength == 0) {
	      decrypteddata = await window.auth.user.HexaEight.DecryptBytes(
        	window.name,
	        destination,
        	new Uint8Array(response.data)
      	      );
	}
      }

      response.data = decrypteddata;
      response.config.responseType = response.config.originalresponseType;

      try {
        if (
          response.headers.hasOwnProperty("x-content-type") &&
          response.headers["x-content-type"] != ""
        ) {
          response.headers["content-type"] = response.headers["x-content-type"];
        }
      } catch {}

      try {
        if (
          response.headers.hasOwnProperty("x-content-type") &&
          response.headers["x-content-length"] != ""
        ) {
          response.headers["content-length"] =
            response.headers["x-content-length"];
        }
      } catch {}

	if (response.config.originalresponseType === "blob") {
  		try {
    			if (response.data instanceof Uint8Array) {
		      		response.data = new Blob([decrypteddata], {
        			type: response.headers["x-content-type"],
      				});
      				response.config.responseType = response.config.originalresponseType;
    			} else {
      				response.config.responseType = "arraybuffer";
    			}
  		} catch (error) {
			response.data = decrypteddata;
    			response.config.responseType = "arraybuffer";
  		}
	}

      if (response.config.originalresponseType == "text") {
        try {
          response.data = new TextDecoder()
            .decode(decrypteddata)
            .toString()
            .replace(/[^\x20-\x7E]/g, "");
          response.config.responseType = response.config.originalresponseType;
        } catch {
          response.data = decrypteddata;
          response.config.responseType = "arraybuffer";
        }
      }
      if (response.config.originalresponseType == "json") {
        try {
          response.data = JSON.parse(
            new TextDecoder()
              .decode(decrypteddata)
              .toString()
              .replace(/[^\x20-\x7E]/g, "")
          );
          response.config.responseType = response.config.originalresponseType;
        } catch {
          response.data = decrypteddata;
          response.config.responseType = "arraybuffer";
        }
      }
      return response;
    } else {
      return response;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosHexaEightInstance;
export const HexaEightaxios = axiosHexaEightInstance;
