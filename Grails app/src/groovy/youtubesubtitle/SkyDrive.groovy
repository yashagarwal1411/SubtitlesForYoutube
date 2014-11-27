package youtubesubtitle
import org.apache.commons.io.IOUtils

import static groovyx.net.http.ContentType.URLENC
import groovy.json.JsonSlurper
import groovy.util.logging.Log4j
import groovyx.net.http.RESTClient

@Log4j
class SkyDrive {

    static def API_BASE_URL = "https://apis.live.net/v5.0/"
    static def AUTH_BASE_URL = "https://login.live.com/"
    private static final String CLIENT_ID = "YOUR_CLIENT_ID"
    private static final String CLIENT_SECRET = "YOUR_CLIENT_SECRET"
    private static final String REDIRECT_URI = "YOUR_REDIRECT_URI"

    /**
     * return the refreshed access token for given user.
     * access token is valid for 3600 secs.
     * @param user
     */
    static def getAccessToken() {
        def refreshToken = "YOUR_REFRESH_TOKEN"
        def authData = refreshAccessToken(refreshToken)
        return authData["access_token"]
    }

    static def refreshAccessToken(def refreshToken) {
        def restClient = new RESTClient(AUTH_BASE_URL)
        def resp = restClient.post(
                path: 'oauth20_token.srf',
                body: [client_id   : CLIENT_ID, client_secret: CLIENT_SECRET,
                       redirect_uri: "$REDIRECT_URI/OAuth/onedriveCallback", refresh_token: refreshToken, grant_type: 'refresh_token'],
                requestContentType: URLENC)
        return resp.data
    }

    static def getEmbedURI(fileId, accessToken) {
        def urlString = "https://apis.live.net/v5.0/" + fileId + "/embed?access_token=" + accessToken
        def url = new URL(urlString)
        def connection = url.openConnection()
        connection.setRequestMethod("GET")
        connection.doOutput = true
        connection.connect()

        if (connection.responseCode == 200) {
            def slurper = new JsonSlurper()
            return slurper.parseText(connection.content.text)
        } else {
            log.error "Error in  getEmbedURI | Response Code: $connection.responseCode , Response Text: $connection.content.text"
            return null
        }
    }


    static def uploadFile(fileName, file, accessToken, folderId) {
        log.info "Uploading File: $fileName , In folderId: $folderId"
        def uploadURI = API_BASE_URL + folderId + "/files/" + fileName

        uploadURI = uploadURI + "?access_token=$accessToken&overwrite=ChooseNewName"
        def url = new URL(uploadURI)
        def connection = url.openConnection()
        connection.setRequestMethod("PUT")
        connection.doOutput = true

        OutputStream output = connection.getOutputStream();
        PrintWriter writer = new PrintWriter(new OutputStreamWriter(output, "UTF8"), true);
        InputStream fileInputStream = file.getInputStream();

        byte[] buffer = new byte[4096];
        int length;
        while ((length = fileInputStream.read(buffer)) > 0) {
            output.write(buffer, 0, length);
        }
        output.flush();
        writer.flush();
        connection.connect()

        if (connection.responseCode == 201) {
            def slurper = new JsonSlurper()
            log.info "File uploaded successfully"
            return slurper.parseText(connection.content.text)
        } else {
            log.info "Error in file upload | Response Code: $connection.responseCode , Response Text: $connection.content.text"
            return null
        }
    }

    static def uploadFromInputStream(fileName, fileInputStream, accessToken, folderId) {

        def uploadURI = API_BASE_URL + folderId + "/files/" + fileName + "?access_token=$accessToken&overwrite=ChooseNewName"

        def url = new URL(uploadURI)
        def connection = url.openConnection()
        connection.setRequestMethod("PUT")
        connection.doOutput = true

        OutputStream output = connection.getOutputStream();
        IOUtils.copy(fileInputStream, output)
        connection.connect()

        if (connection.responseCode == 201) {
            def slurper = new JsonSlurper()
            log.info "File $fileName uploaded successfully"
            return slurper.parseText(connection.content.text)
        } else {
            return null
            log.info "Error in uploading file $fileName | Response Code: $connection.responseCode , Response Text: $connection.content.text"
        }
    }

    static def sanitize(name) {
        return name.replaceAll("[^a-zA-Z0-9_]", "")
    }

    //This url cannot be used for long durations
    //as it will expire when access token expires
    static def getDownloadURL(fileId, accessToken) {
        def downloadURL =  SkyDrive.API_BASE_URL + fileId + "/content?suppress_redirects=true&access_token=" + accessToken
        def url = new URL(downloadURL)
        def connection = url.openConnection()
        connection.setRequestMethod("GET")

        if (connection.responseCode == 200) {
            def slurper = new JsonSlurper()
            def resp = slurper.parseText(connection.content.text)
            return resp.location
        } else {
            log.error "Error in  getEmbedURI | Response Code: $connection.responseCode , Response Text: $connection.content.text"
            return null
        }
    }


}
