/**
 * Created by hamzaghandouri on 26/01/15.
 */
define(function(require) {
    'use strict';

    return {
        "": "index@home",
        "login": "login",
        "logout": "logout",
        "home": "home",
        "settings": "settings",
        "events": "events",
        "files/:folderId/:folderName": "files",
        "folder/:companyId/:companyName": "folder",
        "companies": "companies",
        "employees/:id": "employeeDetails",
        "employees/:id/reports": "reports"
    }
});