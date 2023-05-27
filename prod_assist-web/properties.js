import axios from 'axios';
import Router from "next/router";
import { toast } from 'react-toastify';

//SERVER DEV AWS
export const serverURL = 'https://dev.skoruz.ai/easa-server/';
// export const API_KEY = 'AIzaSyASknJFKaf-jwUpSG6tyBXKE-Ke44uKA0s';
// export const clientId = '258719210559-hjqp2h4dfnclal2vaioehufs4sndf5g6.apps.googleusercontent.com';

export const API_KEY = 'AIzaSyDCEQDssIBpP7KUkhZedmZG4ogjiAw95pU';
export const clientId = '773360764094-iovu972c6kjngdbc8bunm08q5okeufpk.apps.googleusercontent.com';


export async function commonPostService(url, data) {
    if (getCookie()) {
        return axios.post(serverURL + url, data, { headers: { 'Authorization': `Bearer ${getCookie()}` } })
            .then((response) => {
                return response.data;
            })
            .catch(function (error) {
                if (error.response && error.response.status === 401 && error.response.data === 'Unauthorized Access') {
                    Router.push('/')
                }
            });
    }
    else {
        return axios.post(serverURL + url, data)
            .then((response) => {
                return response.data;
            })
            .catch(function (error) {
                if (error.response && error.response.status === 401 && error.response.data === 'Unauthorized Access') {
                    Router.push('/')
                }
            });
    }
}

export async function commonGetService(url) {
    if (getCookie()) {
        return axios.get(serverURL + url, { headers: { 'Authorization': `Bearer ${getCookie()}` } })
            .then((response) => {
                return response.data;
            })
            .catch(function (error) {
                if (error.response && error.response.status === 401 && error.response.data === 'Unauthorized Access') {
                    Router.push('/')
                }
            });
    }
    else {
        return axios.post(serverURL + url, data)
            .then((response) => {
                return response.data;
            })
            .catch(function (error) {
                if (error.response && error.response.status === 401 && error.response.data === 'Unauthorized Access') {
                    Router.push('/')
                }
            });
    }
}

export const getCookie = () => {
    try {
        const cookieString = document.cookie || '';
        let lastToken;
        for (const cookie of cookieString.split(';')) {
            const cookieArray = cookie.split('=');
            if (cookieArray[0].trim() === 'X-XSRF-TOKEN') {
                lastToken = cookieArray[1].trim();
                return lastToken;
            }
        }
    } catch {
        return;
    }
}

export const notify = (msg) => toast(msg, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
});
export const notifyInfo = (msg) => toast.info(msg, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
});
export const notifySuccess = (msg) => toast.success(msg, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
});
export const notifyWarning = (msg) => toast.warning(msg, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
});
export const notifyError = (msg) => toast.error(msg, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
});
