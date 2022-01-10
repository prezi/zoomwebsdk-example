import crypto from 'crypto';
import {ZoomMtg} from '@zoomus/websdk';
import {DOMElement} from "react";
import ZoomMtgEmbedded from "@zoomus/websdk/embedded";

function addCSS(href: string) {
    const head = document.getElementsByTagName('head')[0];
    const s = document.createElement('link');
    s.setAttribute('rel', 'stylesheet');
    s.href = href;
    head.appendChild(s);
}

addCSS('https://source.zoom.us/2.1.1/css/bootstrap.css');
addCSS('https://source.zoom.us/2.1.1/css/react-select.css');
ZoomMtg.setZoomJSLib('https://source.zoom.us/2.1.1/lib', '/av');
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
// loads language files, also passes any error messages to the ui
ZoomMtg.i18n.load('en-US');
ZoomMtg.i18n.reload('en-US');

export function monkeyPatchMediaDevices(deviceId:string, label: string) {
    console.log('monkeyPatchMediaDevices');
    const enumerateDevicesFn = MediaDevices.prototype.enumerateDevices;
    const getUserMediaFn = MediaDevices.prototype.getUserMedia;

    MediaDevices.prototype.enumerateDevices = async function () {
        const res = await enumerateDevicesFn.call(navigator.mediaDevices);
        // We could add "Virtual VHS" or "Virtual Median Filter" and map devices with filters.
        return [{
            deviceId,
            groupId: "uh",
            kind: "videoinput",
            label,
            toJSON: () => {
                return JSON.stringify({
                    deviceId,
                    groupId: "uh",
                    kind: "videoinput",
                    label,
                });
            }
        }];
    };

    MediaDevices.prototype.getUserMedia = async function (...args) {
        const requestedDeviceId = args?.[0]?.video && typeof args?.[0]?.video !== 'boolean' && args?.[0]?.video.deviceId;

        /*if (requestedDeviceId)  {
            if (
                requestedDeviceId === deviceId ||
                (typeof requestedDeviceId !== "string" && !Array.isArray( requestedDeviceId) && requestedDeviceId.exact === deviceId)
            ) {*/
        // This constraints could mimick closely the request.
        // Also, there could be a preferred webcam on the options.
        // Right now it defaults to the predefined input.
        return await navigator.mediaDevices.getDisplayMedia({
            video: true,
            // @ts-ignore
            preferCurrentTab: true
        });
        // }
        //}
        //const res = await getUserMediaFn.call(navigator.mediaDevices, ...args);
        //return res;
    };

    console.log('VIRTUAL WEBCAM INSTALLED.')
}

export async function joinZoomMeeting(
    apiKey: string,
    apiSecret: string,
    meetingNumber: string,
    userName: string,
    passWord: string,
    leaveUrl: string,
    userEmail: string,
    element: HTMLElement,
) {
    const meetingConfig = {
        apiKey,
        meetingNumber,
        userName,
        passWord,
        leaveUrl,
        role: 0,
        userEmail,
        lang: 'en-US',
        signature: ZoomMtg.generateSignature({
            apiKey,
            apiSecret,
            meetingNumber,
            role: '0',
        }),
        china: false,
    };

    // WebSDK Embedded init
    var rootElement = element;
    var zmClient = ZoomMtgEmbedded.createClient();

    await zmClient.init({
        debug: true,
        zoomAppRoot: rootElement,
        // assetPath: 'https://websdk.zoomdev.us/2.0.0/lib/av', //default
        language: meetingConfig.lang,
        customize: {
            meetingInfo: ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
            toolbar: {
                buttons: [
                    {
                        text: 'CustomizeButton',
                        className: 'CustomizeButton',
                        onClick: () => {
                            console.log('click Customer Button');
                        }
                    }
                ]
            }
        }
    }).then((e) => {
        console.log('success', e);
    }).catch((e) => {
        console.log('error', e);
    });

    // WebSDK Embedded join
    await zmClient.join({
        apiKey: meetingConfig.apiKey,
        signature: meetingConfig.signature,
        meetingNumber: meetingConfig.meetingNumber,
        userName: meetingConfig.userName,
        password: meetingConfig.passWord,
        userEmail: meetingConfig.userEmail,
    }).then((e) => {
        console.log('success', e);
    }).catch((e) => {
        console.log('error', e);
    });
    return zmClient;
}