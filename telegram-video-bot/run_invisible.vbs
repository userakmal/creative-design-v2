' =====================================================
' Telegram Video Downloader Bot - Invisible Runner
' =====================================================
' This VBScript runs the bot in complete background mode.
' No visible CMD window will appear.
' =====================================================

Option Explicit

Dim objShell, strScriptPath, strWorkingDir

' Get the directory where this script is located
strScriptPath = GetScriptDirectory()
strWorkingDir = strScriptPath

' Create shell object
Set objShell = CreateObject("WScript.Shell")

' Run the batch file invisibly (window style 0 = hidden)
' The "False" parameter means the script won't wait for completion
objShell.Run """" & strScriptPath & "\start_bot_auto.bat""", 0, False

' Log that we started the bot (optional, for debugging)
' Dim objFSO, objLogFile
' Set objFSO = CreateObject("Scripting.FileSystemObject")
' Set objLogFile = objFSO.OpenTextFile(strScriptPath & "\bot_invisible_start.log", 8, True)
' objLogFile.WriteLine "[" & Now & "] Bot invisible runner started"
' objLogFile.Close

' Clean up
Set objShell = Nothing

' Function to get the directory where this script is located
Function GetScriptDirectory()
    Dim objFSO, strScriptFullPath, strScriptDir
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    strScriptFullPath = WScript.ScriptFullName
    strScriptDir = objFSO.GetParentFolderName(strScriptFullPath)
    GetScriptDirectory = strScriptDir
    Set objFSO = Nothing
End Function
