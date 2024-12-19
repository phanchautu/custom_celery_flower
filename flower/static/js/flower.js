/*jslint browser: true */
/*global $, WebSocket, jQuery */
// import AWS from '../../../node_modules/@aws-sdk/client-s3';
// const { PutObjectCommand, S3Client } = import '@aws-sdk/client-s3'
// import { PutObjectCommand, S3Client } from '../../../node_modules/@aws-sdk/client-s3'
// import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
// const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
// // const { getSignedUrl } = require('@aws-sdk/client-s3');
// import axios from '../../../node_modules/axios/lib/axios'
// const axios = require('axios')



// const { default: axios } = require("axios");


// import axios from "axios";
// const s3Client = new S3Client({
//   region: 'us-east-1',
//   credentials: {
//     accessKeyId: 'FR46RKQH5H6OUSSRC4TYELDGNM',
//     secretAccessKey: 'G75HY7YIAIZT5R5NA3M7GMAO4DKBGWWNMYR7C3JWBI2FWHWYK5CQ'
//   },
//   endpoint: {
//     url: 'https://s3.w3s.aioz.network',
//   },
//   forcePathStyle: true
// })

// const filePath = '/home/tuphan/Desktop/FlowerV2/flower/w3s_upload.js';
// const folder = 'node_version/'

// const bucketParams = {
//   Bucket: 'w3ai-platform',
//   Key: folder + path.basename(filePath),
//   Body: fs.createReadStream(filePath)
// }


var flower = (function () {
    "use strict";

    var alertContainer = document.getElementById('alert-container');
    function show_alert(message, type) {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible" role="alert">
                <div>${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        alertContainer.appendChild(wrapper);
    }

    function url_prefix() {
        var prefix = $('#url_prefix').val();
        if (prefix) {
            prefix = prefix.replace(/\/+$/, '');
            if (prefix.startsWith('/')) {
                return prefix;
            } else {
                return '/' + prefix;
            }
        }
        return '';
    }

    //https://github.com/DataTables/DataTables/blob/1.10.11/media/js/jquery.dataTables.js#L14882
    function htmlEscapeEntities(d) {
        return typeof d === 'string' ?
            d.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') :
            d;
    }

    function active_page(name) {
        var pathname = $(location).attr('pathname');
        if (name === '/') {
            return pathname === (url_prefix() + name);
        }
        else {
            return pathname.startsWith(url_prefix() + name);
        }
    }

    $('#worker-refresh').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $('.dropdown-toggle').dropdown('hide');

        var workername = $('#workername').text();

        $.ajax({
            type: 'GET',
            url: url_prefix() + '/api/workers',
            dataType: 'json',
            data: {
                workername: unescape(workername),
                refresh: 1
            },
            success: function (data) {
                show_alert(data.message || 'Successfully refreshed', 'success');
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-refresh-all').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $('.dropdown-toggle').dropdown('hide');

        $.ajax({
            type: 'GET',
            url: url_prefix() + '/api/workers',
            dataType: 'json',
            data: {
                refresh: 1
            },
            success: function (data) {
                show_alert(data.message || 'Refreshed All Workers', 'success');
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-pool-restart').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $('.dropdown-toggle').dropdown('hide');

        var workername = $('#workername').text();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/pool/restart/' + workername,
            dataType: 'json',
            data: {
                workername: workername
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-shutdown').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $('.dropdown-toggle').dropdown('hide');

        var workername = $('#workername').text();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/shutdown/' + workername,
            dataType: 'json',
            data: {
                workername: workername
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-pool-grow').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            grow_size = $('#pool-size').val();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/pool/grow/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'n': grow_size,
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-pool-shrink').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            shrink_size = $('#pool-size').val();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/pool/shrink/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'n': shrink_size,
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-pool-autoscale').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            min = $('#min-autoscale').val(),
            max = $('#max-autoscale').val();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/pool/autoscale/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'min': min,
                'max': max,
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-add-consumer').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var workername = $('#workername').text(),
            queue = $('#add-consumer-name').val();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/queue/add-consumer/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'queue': queue,
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#worker-queues').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!event.target.id.startsWith("worker-cancel-consumer")) {
            return;
        }

        var workername = $('#workername').text(),
            queue = $(event.target).closest("tr").children("td:eq(0)").text();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/worker/queue/cancel-consumer/' + workername,
            dataType: 'json',
            data: {
                'workername': workername,
                'queue': queue,
            },
            success: function (data) {
                show_alert(data.message, "success");
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#limits-table').on('click', function (event) {
        if (event.target.id.startsWith("task-timeout-")) {
            var timeout = parseInt($(event.target).siblings().closest("input").val()),
                type = $(event.target).text().toLowerCase(),
                taskname = $(event.target).closest("tr").children("td:eq(0)").text(),
                post_data = {'workername': $('#workername').text()};

            taskname = taskname.split(' ')[0]; // removes [rate_limit=xxx]
            post_data[type] = timeout;

            if (!Number.isInteger(timeout)) {
                show_alert("Invalid timeout value", "danger");
                return;
            }

            $.ajax({
                type: 'POST',
                url: url_prefix() + '/api/task/timeout/' + taskname,
                dataType: 'json',
                data: post_data,
                success: function (data) {
                    show_alert(data.message, "success");
                },
                error: function (data) {
                    show_alert($(data.responseText).text(), "danger");
                }
            });
        } else if (event.target.id.startsWith("task-rate-limit-")) {
            var taskname = $(event.target).closest("tr").children("td:eq(0)").text(),
                workername = $('#workername').text(),
                ratelimit = parseInt($(event.target).prev().val());

            taskname = taskname.split(' ')[0]; // removes [rate_limit=xxx]

            $.ajax({
                type: 'POST',
                url: url_prefix() + '/api/task/rate-limit/' + taskname,
                dataType: 'json',
                data: {
                    'workername': workername,
                    'ratelimit': ratelimit,
                },
                success: function (data) {
                    show_alert(data.message, "success");
                },
                error: function (data) {
                    show_alert(data.responseText, "danger");
                }
            });
        }
    });

    $('#task-revoke').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var taskid = $('#taskid').text();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/task/revoke/' + taskid,
            dataType: 'json',
            data: {
                'terminate': false,
            },
            success: function (data) {
                show_alert(data.message, "success");
                document.getElementById("task-revoke").disabled = true;
                setTimeout(function() {location.reload();}, 5000);
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#task-terminate').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var taskid = $('#taskid').text();

        $.ajax({
            type: 'POST',
            url: url_prefix() + '/api/task/revoke/' + taskid,
            dataType: 'json',
            data: {
                'terminate': true,
            },
            success: function (data) {
                show_alert(data.message, "success");
                document.getElementById("task-terminate").disabled = true;
                setTimeout(function() {location.reload();}, 5000);
            },
            error: function (data) {
                show_alert(data.responseText, "danger");
            }
        });
    });

    $('#load_node_button').on('click',async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const productTypeSelected = document.getElementById('product_type')
        var productType = productTypeSelected.value;
        const nodeTypeTypeSelected = document.getElementById('node_type')
        var nodeType = nodeTypeTypeSelected.value;
        initNodeDatable(productType, nodeType)
    });
    
  

    

    const folder = 'node_version/'
    const bucket = 'w3ai-platform'
    const chunkSize = 10*1024*1024    // 100MB
    const largeFileSizeThreshold = 10*1024*1024 // 10MB
    const expireTime = 3600*168 // less 1 week
    const apiToken = "any"
    const hubEndpoint = "${node_url}"

    $('#attach_file_linux').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const fileInput = document.getElementById("file_linux");
        const url_result_text = document.getElementById("linux_url_result")
        const file = fileInput.files[0];
        if (!file) {
          alert("Please select a file to upload.");
          return;
        }
        url_result_text.value = "Uploading ...."
        if (file.size < largeFileSizeThreshold){
            const resultUrl = await uploadSingleFile(file)
            url_result_text.value = resultUrl
        }
        else{
            const resultUrl = await uploadMultipartFile(file)
            url_result_text.value = resultUrl
            if(resultUrl != null){
                alert("Upload file success")
            }
        } 
    })

    $('#attach_file_win').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const fileInput = document.getElementById("file_win");
        const url_result_text = document.getElementById("win_url_result")
        const file = fileInput.files[0];
        if (!file) {
          alert("Please select a file to upload.");
          return;
        }
        url_result_text.value = "Uploading ...."
        if (file.size < largeFileSizeThreshold){
            const resultUrl = await uploadSingleFile(file)
            url_result_text.value = resultUrl
        }
        else{
            const resultUrl = await uploadMultipartFile(file)
            url_result_text.value = resultUrl
            if(resultUrl != null){
                alert("Upload file success")
            }
        } 
    })

    $('#attach_file_mac_intel').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const fileInput = document.getElementById("file_mac_intel");
        const url_result_text = document.getElementById("mac_intel_url_result")
        const file = fileInput.files[0];
        if (!file) {
          alert("Please select a file to upload.");
          return;
        }
        url_result_text.value = "Uploading ...."
        if (file.size < largeFileSizeThreshold){
            const resultUrl = await uploadSingleFile(file)
            url_result_text.value = resultUrl
        }
        else{
            const resultUrl = await uploadMultipartFile(file)
            url_result_text.value = resultUrl
            if(resultUrl != null){
                alert("Upload file success")
            }
        } 
    })


    $('#attach_file_mac_apple').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const fileInput = document.getElementById("file_mac_apple");
        const url_result_text = document.getElementById("mac_apple_url_result")
        const file = fileInput.files[0];
        if (!file) {
          alert("Please select a file to upload.");
          return;
        }
        url_result_text.value = "Uploading ...."
        if (file.size < largeFileSizeThreshold){
            const resultUrl = await uploadSingleFile(file)
            url_result_text.value = resultUrl
        }
        else{
            const resultUrl = await uploadMultipartFile(file)
            url_result_text.value = resultUrl
            if(resultUrl != null){
                alert("Upload file success")
            }
        } 
    })

    $('#upload-node-version-button').on('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const prodTypeSelection = document.getElementById("upload_product_type");
        const nodeVersionText = document.getElementById("node_version_text");
        const linux_url_result = document.getElementById("linux_url_result").value;
        const win_url_result = document.getElementById("win_url_result").value;
        const mac_intel_url_result = document.getElementById("mac_intel_url_result").value;
        const mac_apple_url_result = document.getElementById("mac_apple_url_result").value;
        var productType = prodTypeSelection.innerText;
        var releaseType = "pending";
        var nodeVersion = nodeVersionText.value

        if(nodeVersion == ""){
          alert("Node version is invalid")
          return
        }

        if (linux_url_result == ""){
          alert("Linux url is invalid")
          return
        }
        else if (win_url_result == "" ){
          alert("Windows url is invalid")
          return  
        }
        else if (mac_intel_url_result == ""){
          alert("MacOS-Intel url is invalid")
          return 
        }
        else if (mac_apple_url_result == ""){
          alert("MacOS-Apple url is invalid")
          return 
        }
        var endpoint = `${node_url}management/node/version/new?release_type=${releaseType}&product_type=${productType}&version=${nodeVersion}
                        &linux_url=${linux_url_result}
                        &windows_url=${win_url_result}
                        &macOs_intel_url=${mac_intel_url_result}
                        &macOs_apple_url=${mac_apple_url_result}`
        try {
          const uploadRes = await axios.post(endpoint, "", {headers:{
              "accept" : "application/json",
              "api-token": apiToken
        }})
          if(uploadRes.status < 300){
            alert(`${uploadRes.data.message}`)
          }
          else{
            alert("Create node version failed")
          }
        // reload
        const productTypeSelected = document.getElementById('product_type')
        var productType = productTypeSelected.value;
        initNodeDatable(productType, 'all')

        } catch (error) {
            alert(`Create node version error : ${error}`)
        }
    })


    const uploadSingleFile = async (file )=>{
        try {
            const endpoint = `${hubEndpoint}storage/presigned_url/upload/node_version/${file.name}`
            const headers = {
                        "accept": "application/json",
                        "api-token": apiToken,
                        "Content-Type": "application/json",
                        } 
            const res = await axios.get(endpoint, {headers:headers})
            if (res.status == 200){
                const uploadUrl = res.data?.data?.upload_info?.upload_url
                const uploadHeaders = res.data?.data?.upload_info?.headers
                const uploadFileRes = await axios.put(uploadUrl, file,{headers:uploadHeaders} )
                if (uploadFileRes.status == 200){
                    alert("Upload file success")
                    return res.data?.data?.download_url
                }
                else{
                    alert("Upload file failed")
                    return null
                }
            }
        } catch (error) {
            alert(`Upload file failed : ${error}`)
            return null
        }
    }

    const uploadMultipartFile = async(file)=>{
  
        try {
        const endpoint = `${hubEndpoint}storage/multipart/upload_id/node_version/${file.name}`
        const headers = {
                    "accept": "application/json",
                    "api-token": apiToken,
                    } 
        const res = await axios.get(endpoint, {headers:headers})
        if (res.status == 200){
            const uploadId = res.data.data.upload_id
            const chunkSize = res.data.data.part_size
            const fileName = res.data.data.file_name
            let totalSize = file.size
            let numOfPart = Math.ceil(totalSize/chunkSize)
            for (let i = 0; i < numOfPart; i++) {
                let start = i * chunkSize;
                let end = Math.min(start + chunkSize, totalSize);
                let chunk = file.slice(start, end);
                const getLinkFileUrl = `${hubEndpoint}storage/multipart/upload_url/${folder}${fileName}?upload_id=${uploadId}&part_number=${i+1}`
                const getLinkFileRes = await axios.get(getLinkFileUrl, {headers:headers})
                if (getLinkFileRes.status == 200){
                    const uploadFileUrl = getLinkFileRes.data.data.upload_url
                    const uploadFileHeaders = getLinkFileRes.data.data.headers
                    const uploadFileRes = await axios.put(uploadFileUrl, chunk,{headers:uploadFileHeaders} )
                    if(uploadFileRes.status != 200){
                    return null
                    }
                }
            }
            const completeMultipartUploadUrl = `${hubEndpoint}storage/multipart/complete_part/${folder}${fileName}?upload_id=${uploadId}&part_number=${numOfPart}`
            const completeMultipartUploadRes = await axios.get(completeMultipartUploadUrl, {headers:headers})
            if(completeMultipartUploadRes.status == 200){
                return completeMultipartUploadRes.data
            }
        }
        } catch (error) {
            alert(`Upload multifile failed : ${error}`)
            return null
        }
      }

    function sum(a, b) {
        return parseInt(a, 10) + parseInt(b, 10);
    }

    function format_time(timestamp) {
        var time = $('#time').val(),
            prefix = time.startsWith('natural-time') ? 'natural-time' : 'time',
            tz = time.substr(prefix.length + 1) || 'UTC';

        if (prefix === 'natural-time') {
            return moment.unix(timestamp).tz(tz).fromNow();
        }
        return moment.unix(timestamp).tz(tz).format('YYYY-MM-DD HH:mm:ss.SSS');
    }

    function isColumnVisible(name) {
        var columns = $('#columns').val();
        if (columns === "all")
            return true;
        if (columns) {
            columns = columns.split(',').map(function (e) {
                return e.trim();
            });
            return columns.indexOf(name) !== -1;
        }
        return true;
    }


    $.urlParam = function (name) {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        return (results && results[1]) || 0;
    };

    $(document).ready(function () {
        //https://github.com/twitter/bootstrap/issues/1768
        var shiftWindow = function () {
            scrollBy(0, -50);
        };
        if (location.hash) {
            shiftWindow();
        }
        window.addEventListener("hashchange", shiftWindow);

        // Make bootstrap tabs persistent
        $(document).ready(function () {
            if (location.hash !== '') {
                $('a[href="' + location.hash + '"]').tab('show');
            }

            // Listen for tab shown events and update the URL hash fragment accordingly
            $('.nav-tabs a[data-bs-toggle="tab"]').on('shown.bs.tab', function (event) {
                const tabPaneId = $(event.target).attr('href').substr(1);
                if (tabPaneId) {
                    window.location.hash = tabPaneId;
                }
            });
        });
    });

    $(document).ready(function () {
        if (!active_page('/') && !active_page('/workers')) {
            return;
        }

        $('#workers-table').DataTable({
            rowId: 'name',
            searching: true,
            select: false,
            paging: true,
            scrollCollapse: true,
            lengthMenu: [15, 30, 50, 100],
            pageLength: 15,
            language: {
                lengthMenu: 'Show _MENU_ workers',
                info: 'Showing _START_ to _END_ of _TOTAL_ workers',
                infoFiltered: '(filtered from _MAX_ total workers)'
            },
            ajax: url_prefix() + '/workers?json=1',
            order: [
                [1, "des"]
            ],
            footerCallback: function( tfoot, data, start, end, display ) {
                var api = this.api();
                var columns = {2:"STARTED", 3:"", 4:"FAILURE", 5:"SUCCESS", 6:"RETRY"};
                for (const [column, state] of Object.entries(columns)) {
                    var total = api.column(column).data().reduce(sum, 0);
                    var footer = total;
                    if (total !== 0) {
                        let queryParams = (state !== '' ? `?state=${state}` : '');
                        footer = '<a href="' + url_prefix() + '/tasks' + queryParams + '">' + total + '</a>';
                    }
                    $(api.column(column).footer()).html(footer);
                }
            },
            columnDefs: [{
                targets: 0,
                data: 'hostname',
                type: 'natural',
                render: function (data, type, full, meta) {
                    return '<a href="' + url_prefix() + '/worker/' + encodeURIComponent(data) + '">' + data + '</a>';
                }
            }, {
                targets: 1,
                data: 'status',
                className: "text-center",
                width: "10%",
                render: function (data, type, full, meta) {
                    if (data) {
                        return '<span class="badge bg-success">Online</span>';
                    } else {
                        return '<span class="badge bg-secondary">Offline</span>';
                    }
                }
            }, {
                targets: 2,
                data: 'active',
                className: "text-center",
                width: "10%",
                defaultContent: 0
            }, {
                targets: 3,
                data: 'processed',
                className: "text-center",
                width: "10%",
                defaultContent: 0
            }, {
                targets: 4,
                data: 'task-failed',
                className: "text-center",
                width: "10%",
                defaultContent: 0
            }, {
                targets: 5,
                data: 'task-succeeded',
                className: "text-center",
                width: "10%",
                defaultContent: 0
            }, {
                targets: 6,
                data: 'task-retried',
                className: "text-center",
                width: "10%",
                defaultContent: 0
            }, {
                targets: 7,
                data: 'loadavg',
                width: "10%",
                className: "text-center text-nowrap",
                render: function (data, type, full, meta) {
                    if (!full.status) {
                        return 'N/A';
                    }
                    if (Array.isArray(data)) {
                        return data.join(', ');
                    }
                    return data;
                }
            }, ],
        });

        var autorefresh_interval = $.urlParam('autorefresh') || 1;
        if (autorefresh !== 0) {
            setInterval( function () {
                $('#workers-table').DataTable().ajax.reload(null, false);
            }, autorefresh_interval * 5000);
        }

    });

    $(document).ready(function () {
        if (!active_page('/tasks')) {
            return;
        }

        $('#tasks-table').DataTable({
            rowId: 'uuid',
            searching: true,
            scrollX: true,
            scrollCollapse: true,
            processing: true,
            serverSide: true,
            colReorder: true,
            lengthMenu: [15, 30, 50, 100],
            pageLength: 15,
            stateSave: true,
            language: {
                lengthMenu: 'Show _MENU_ tasks',
                info: 'Showing _START_ to _END_ of _TOTAL_ tasks',
                infoFiltered: '(filtered from _MAX_ total tasks)'
            },
            ajax: {
                type: 'POST',
                url: url_prefix() + '/tasks/datatable'
            },
            order: [
                [7, "desc"]
            ],
            oSearch: {
                "sSearch": $.urlParam('state') ? 'state:' + $.urlParam('state') : ''
            },
            columnDefs: [{
                targets: 0,
                data: 'name',
                visible: isColumnVisible('name'),
                render: function (data, type, full, meta) {
                    return data;
                }
            }, {
                targets: 1,
                data: 'uuid',
                visible: isColumnVisible('uuid'),
                orderable: false,
                className: "text-nowrap",
                render: function (data, type, full, meta) {
                    return '<a href="' + url_prefix() + '/task/' + encodeURIComponent(data) + '">' + data + '</a>';
                }
            }, {
                targets: 2,
                data: 'state',
                visible: isColumnVisible('state'),
                className: "text-center",
                render: function (data, type, full, meta) {
                    switch (data) {
                    case 'SUCCESS':
                        return '<span class="badge bg-success">' + data + '</span>';
                    case 'FAILURE':
                        return '<span class="badge bg-danger">' + data + '</span>';
                    default:
                        return '<span class="badge bg-secondary">' + data + '</span>';
                    }
                }
            }, {
                targets: 3,
                data: 'args',
                className: "text-nowrap overflow-auto",
                visible: isColumnVisible('args'),
                render: htmlEscapeEntities
            }, {
                targets: 4,
                data: 'kwargs',
                className: "text-nowrap overflow-auto",
                visible: isColumnVisible('kwargs'),
                render: htmlEscapeEntities
            }, {
                targets: 5,
                data: 'result',
                visible: isColumnVisible('result'),
                className: "text-nowrap overflow-auto",
                render: htmlEscapeEntities
            }, {
                targets: 6,
                data: 'received',
                className: "text-nowrap",
                visible: isColumnVisible('received'),
                render: function (data, type, full, meta) {
                    if (data) {
                        return format_time(data);
                    }
                    return data;
                }
            }, {
                targets: 7,
                data: 'started',
                className: "text-nowrap",
                visible: isColumnVisible('started'),
                render: function (data, type, full, meta) {
                    if (data) {
                        return format_time(data);
                    }
                    return data;
                }
            }, {
                targets: 8,
                data: 'runtime',
                className: "text-center",
                visible: isColumnVisible('runtime'),
                render: function (data, type, full, meta) {
                    return data ? data.toFixed(2) : data;
                }
            }, {
                targets: 9,
                data: 'worker',
                visible: isColumnVisible('worker'),
                render: function (data, type, full, meta) {
                    return '<a href="' + url_prefix() + '/worker/' + encodeURIComponent(data) + '">' + data + '</a>';
                }
            }, {
                targets: 10,
                data: 'exchange',
                visible: isColumnVisible('exchange')
            }, {
                targets: 11,
                data: 'routing_key',
                visible: isColumnVisible('routing_key')
            }, {
                targets: 12,
                data: 'retries',
                className: "text-center",
                visible: isColumnVisible('retries')
            }, {
                targets: 13,
                data: 'revoked',
                className: "text-nowrap",
                visible: isColumnVisible('revoked'),
                render: function (data, type, full, meta) {
                    if (data) {
                        return format_time(data);
                    }
                    return data;
                }
            }, {
                targets: 14,
                data: 'exception',
                className: "text-nowrap",
                visible: isColumnVisible('exception')
            }, {
                targets: 15,
                data: 'expires',
                visible: isColumnVisible('expires')
            }, {
                targets: 16,
                data: 'eta',
                visible: isColumnVisible('eta')
            }, ],
        });

    });

    $(document).ready(function(){
        
        if (!active_page('/node-version')) {
            return;
        }

        function initNodeDatable(prod, node){
        if(node == 'all'){
            table.destroy();
            table = new DataTable('#node-version-table',{
            rowId: 'name',
            searching: false,
            select: false,
            paging: true,
            lengthMenu: [5, 10, 20, 30],
            pageLength: 5,
            serverSide:false,
            fixedColumns: true,
            scrollCollapse: true,
            scrollX:true,
            scrollY:false,
            autoWidth: false,
            
            ajax: {
                cache: true,
                url: `${node_url}management/node/version/all?product_type=${prod}`,
                type: "GET",
                headers:{
                        "accept": "application/json",
                        "api-token": 'any',
                        "Content-Type": "application/json",
                        } ,
                dataSrc: 'data',
                },
            columnDefs: [{
                targets: 0,
                data: "version_info.version", render: data =>data || null,
                defaultContent: null,
                type: 'natural',
            }, {
                targets: 1,
                data: 'state', render: data =>data || null,
                defaultContent: null,
                className: "text-center",
            }, {
                targets: 2,
                data: 'timestamp', 
                render: function (data, type, row) {
                        return moment(data).format('MMMM Do, h:mm');
                    },
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 3,
                data: 'version_info.url.linux',render: data =>data || null,
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 4,
                data: 'version_info.url.windows',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 5,
                data: 'version_info.url.macOs_intel',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 6,
                data: 'version_info.url.macOs_apple',render: data =>data || null,
                className: "text-center",
            }, {
                data: null,
                createdCell: function (td, cellData, rowData, row, col) {
                    if (rowData.state != 'release') {
                         $(td).html(
                            '<button>Set release</button>'
                            );
                        }
                    else{
                        $(td).html(
                            '<div></div>'
                            );
                    }
                },
                defaultContent: null,
                targets: -1,
            }, 
            ],

            createdRow: function (row, data, dataIndex) {
                if (data.state == 'release') {
                    $(row).attr('style', 'background-color: #f2dede !important;');
                }
            },
            width:'10%',
        }
        );
        }
        else{
            table.destroy();
            table = new DataTable('#node-version-table',{
            rowId: 'name',
            searching: false,
            select: false,
            paging: true,
            lengthMenu: [5, 10, 20, 30],
            pageLength: 5,
            serverSide:false,
            fixedColumns: true,
            scrollCollapse: true,
            scrollX:true,
            scrollY:false,
            autoWidth: false,
            
            ajax: {
                cache: true,
                url: `${node_url}management/node/version/releasing?product_type=${prod}`,
                type: "GET",
                headers:{
                        "accept": "application/json",
                        "api-token": 'any',
                        "Content-Type": "application/json",
                        } ,
                dataSrc: 'data',
                },
            columnDefs: [{
                targets: 0,
                data: "version_info.version", render: data =>data || null,
                defaultContent: null,
                type: 'natural',
            }, {
                targets: 1,
                data: 'state', render: data =>data || null,
                defaultContent: null,
                className: "text-center",
            }, {
                targets: 2,
                data: 'timestamp', 
                render: function (data, type, row) {
                        return moment(data).format('MMMM Do, h:mm');
                    },
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 3,
                data: 'version_info.url.linux',render: data =>data || null,
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 4,
                data: 'version_info.url.windows',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 5,
                data: 'version_info.url.macOs_intel',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 6,
                data: 'version_info.url.macOs_apple',render: data =>data || null,
                className: "text-center",
            }, {
                data: null,
                createdCell: function (td, cellData, rowData, row, col) {
                    $(td).html(
                            '<div></div>'
                            );
                },
                defaultContent: null,
                targets: -1,
            }, 
            ],

            createdRow: function (row, data, dataIndex) {
                if (data.state || data.state == 'release' ) {
                    $(row).attr('style', 'background-color: #f2dede !important;');
                }
            },
            width:'10%',
            }
        );
        }
        }   

        $('#product_type').on('change', async function (event) {
            event.preventDefault();
            event.stopPropagation();
            const upload_product_type = document.getElementById('upload_product_type')
            if(upload_product_type != null){
                upload_product_type.innerText = event.target.value
            }
            var productType = event.target.value;
            const nodeTypeTypeSelected = document.getElementById('node_type')
            var nodeType = nodeTypeTypeSelected.value;
            initNodeDatable(productType, nodeType)

        })

        $('#node_type').on('change', async function (event) {
            event.preventDefault();
            event.stopPropagation();
            const productType = document.getElementById('product_type').value
            var nodeType = event.target.value;
            initNodeDatable(productType, nodeType)
        })


       
        var table = new DataTable('#node-version-table',{
            rowId: 'name',
            searching: false,
            select: false,
            paging: true,
            lengthMenu: [5, 10, 20, 30],
            pageLength: 5,
            serverSide:false,
            fixedColumns: true,
            scrollCollapse: true,
            scrollX:true,
            scrollY:false,
            autoWidth: false,
            
            ajax: {
                cache: true,
                url: `${node_url}management/node/version/all?product_type=training`,
                type: "GET",
                headers:{
                        "accept": "application/json",
                        "api-token": 'any',
                        "Content-Type": "application/json",
                        } ,
                dataSrc: 'data',
                },
            columnDefs: [{
                targets: 0,
                data: "version_info.version", render: data =>data || null,
                defaultContent: null,
                type: 'natural',
            }, {
                targets: 1,
                data: 'state', render: data =>data || null,
                defaultContent: null,
                className: "text-center",
            }, {
                targets: 2,
                data: 'timestamp', 
                render: function (data, type, row) {
                        return moment(data).format('MMMM Do, h:mm');
                    },
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 3,
                data: 'version_info.url.linux',render: data =>data || null,
                className: "text-center",
                defaultContent: 0,
            }, {
                targets: 4,
                data: 'version_info.url.windows',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 5,
                data: 'version_info.url.macOs_intel',render: data =>data || null,
                className: "text-center",
            }, {
                targets: 6,
                data: 'version_info.url.macOs_apple',render: data =>data || null,
                className: "text-center",
            }, {
                data: null,
                createdCell: function (td, cellData, rowData, row, col) {
                    if (rowData.state != 'release') {
                         $(td).html(
                            '<button>Set release</button>'
                            );
                        }
                    else{
                        $(td).html(
                            '<div></div>'
                            );
                    }
                },
                defaultContent: null,
                targets: -1,
            }, 
            ],

            createdRow: function (row, data, dataIndex) {
                if (data.state == 'release') {
                    $(row).attr('style', 'background-color: #f2dede !important;');
                }
            },
            width:'10%',

        }
        );

        table.on('click', 'button', function(e){
            let node_data = table.row(e.target.closest('tr')).data();
            const productTypeSelected = document.getElementById('product_type')
            var productType = productTypeSelected.value;
            if(confirm(`Do you want to rollback for version ${node_data.version_info.version}`)){
                $.ajax({
                    cache: true,
                    type: 'POST',
                    url: `${node_url}management/node/version/release/rollback/version=${node_data.version_info.version}?product_type=${productType}`,
                    headers:{
                        "accept": "application/json",
                        "api-token": 'any',
                        "Content-Type": "application/json",
                        } ,
                success: function (data) {
                    show_alert(`Set release ${node_data.version_info.version} successfully`, "success");
                    },
                error: function (data) {
                    show_alert(data.message || data.responseText || `Rollback version ${data.version_info.version} failed`, "danger");
                    }
                })
            }
            else
                return
        }
    
        )
    })

    $(document).ready(function () {
        if (!active_page('/') && !active_page('/node-version')) {
            return;
        }
        const productTypeSelected = document.getElementById('product_type')
        var productType = productTypeSelected.value;
        const nodeTypeTypeSelected = document.getElementById('node_type')
        var nodeType = nodeTypeTypeSelected.value;
        // initNodeDatable(productType, nodeType)
    });

}(jQuery));
