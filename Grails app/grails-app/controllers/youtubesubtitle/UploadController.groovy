package youtubesubtitle

import grails.converters.JSON
import org.apache.commons.io.IOUtils
import org.springframework.web.multipart.MultipartHttpServletRequest
import org.springframework.web.multipart.commons.CommonsMultipartFile

import java.util.zip.*

class UploadController  {

    def index() {

        log.info "Request Received upload"

        if (!(request instanceof MultipartHttpServletRequest)) {
            response.status = 400
            log.info "Bad request. Request not MultipartHttpServletRequest"
            render "Bad request"
            return
        }
        log.info "Request received for MultipartHttpServletRequest Upload"

        MultipartHttpServletRequest mpr = (MultipartHttpServletRequest) request
        CommonsMultipartFile uploadedFile = (CommonsMultipartFile) mpr.getFile("uploadFile");
        def originalFileName = uploadedFile.originalFilename
        def currentName = SkyDrive.sanitize(originalFileName.split("\\.")[0..-2].join(""))
        def ext = originalFileName.split("\\.")[-1].toLowerCase()
        def newFileName = currentName + "." + ext

        def accessToken = SkyDrive.getAccessToken();

        def topicStorageFolderId = "YOUR_TOPIC_ID_IN_SKYDRIVE"

        log.info "Attempting to upload file: $newFileName, in folderId: $topicStorageFolderId"

        def fileResponse

        if (ext == "zip") {
            ZipInputStream fileInputStream = new ZipInputStream(uploadedFile.getInputStream());
            ZipEntry ze;
            while ((ze=fileInputStream.getNextEntry())!=null) {
                log.info "Found file inside zip $originalFileName with name ${ze.getName()}"
                if (ze.isDirectory()) {
                    //Skip if directory
                    log.info "File ${ze.getName()} is a directory. Moving on to next file"
                    continue
                }

                def zippedFileName = ze.getName()
                def zippedFileExt = zippedFileName.split("\\.")[-1].toLowerCase()

                if (zippedFileExt != "srt") {
                    log.info "File ${ze.getName()} is not of type srt. Moving to next file"
                    continue
                }
                def newZippedFileName = newFileName + "---" + SkyDrive.sanitize(zippedFileName.split("\\.")[0..-2].join("")) + "." + zippedFileExt
                fileResponse = SkyDrive.uploadFromInputStream(newZippedFileName, fileInputStream, accessToken, topicStorageFolderId)
                break;
            }
        } else {
            fileResponse = SkyDrive.uploadFile(newFileName, uploadedFile, accessToken, topicStorageFolderId)
        }

        log.info "File response is $fileResponse"

        def fileURL = SkyDrive.getDownloadURL(fileResponse['id'], accessToken)
        log.info "File url is $fileURL"

        response.status = 200
        def resp = ["url":fileURL]
        render  resp as JSON
    }

    def testUpload() {
        render """
        <form id="multipleChapterUploadForm" action="/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="uploadFile" id="multipleChapterUploadFile"><br>
          <input type="submit" id="submitMultipleFile" name="submit" value="Upload Multiple File">
        </form>
        """
    }

    def accessToken() {
        log.info "Access token request received"
        def accessToken = SkyDrive.getAccessToken()
        render accessToken
    }

    def healthcheck() {
        def resp = [status:"ok", message: "App is up and running"]
        render resp as JSON
    }

    def uploadGZipFile() {
        def url = params.url
        if (!url) {
            render(status: 400, text: "Please provide missing param url")
            return
        }
        url = URLDecoder.decode(url, "UTF-8")
        log.info "Decoded url for uploadGZipFile is $url"
        InputStream is = new URL(url).openConnection().getInputStream()
        response.setHeader("Content-Encoding", "gzip")
        IOUtils.copy(is, response.getOutputStream())
    }

}