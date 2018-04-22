//ApiHelper.js

const baseUrl = "" + "/subtitle"

const getAuthToken = function () {

    chrome.identity.getAuthToken({interactive: true}, token => {
        return new Promise((resolve, reject) => {
            if  (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError)
                reject(null)
                return
            }
            if (!token) {
                console.error("No error and no token, this should ideally not happend")
                reject(null)
                return
            }
            resolve(token)
        })
    })
}

const save_feedback = async function(video_id, srt, language, is_correct, subtitle_id) {
    const url = `/${video_id}/`
    const data = {srt, language, is_correct, subtitle_id}

    const resp = await apiHelper.post(url, data)
    return resp
}

const get_subs = async function(video_id, language) {
    const url = `/${video_id}/${language}`

    const resp = await apiHelper.get(url)
    return resp
}


const apiHelper = new function(getAuthToken) {

    this.ajax = async function(type, url, data) {
        url = baseUrl + url
        token = await getAuthToken()
        resp = await $.ajax({url, data, type, 
            headers: {'Authorization': `Bearer ${token}`}
        })
        return resp
    }

    this.get = this.ajax.bind(this, 'GET')

    this.post = this.ajax.bind(this, 'POST')

}(getAuthToken);


//FOLLOWING IS JUST FOR TESTING PURPOSES LOCALLY//
console.log(save_feedback('XbGs_qK2PQA', sample_srt, "eng", true))
console.log(get_subs('XbGs_qK2PQA', 'eng'))
//TO BE REMOVED LATER


