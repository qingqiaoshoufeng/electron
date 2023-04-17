!include nsDialogs.nsh
!include LogicLib.nsh

!include nsDialogs.nsh
!include LogicLib.nsh

!include "MUI2.nsh"
!include nsDialogs.nsh
!include LogicLib.nsh


#OutFile nsDialogs.exe
#RequestExecutionLevel user
#ShowInstDetails show

; Var Dialog
; Var name
; Var entry
; Var website
; Var openMode

Var appname

XPStyle on
# 此卸载脚本在原有基础上添加指定义卸载页面 用于显示提示用户删除用户数据
Var /GLOBAL Dialog_1
; Var /GLOBAL HLine
Var /GLOBAL VLine
; Var /GLOBAL Text_1
Var /GLOBAL Label_1
Var /GLOBAL Label_2
Var /GLOBAL CheckBox_1
Var /GLOBAL CheckBox_2
Var /GLOBAL CheckBox_3
Var /GLOBAL CheckBox_4
Var /GLOBAL CheckBox_5
Var /GLOBAL Checkbox_State1
Var /GLOBAL Checkbox_State2
Var /GLOBAL Checkbox_State3
Var /GLOBAL Checkbox_State4
Var /GLOBAL Checkbox_State5
Var /GLOBAL Checkbox_StateValue1
Var /GLOBAL Checkbox_StateValue2
Var /GLOBAL Checkbox_StateValue3
Var /GLOBAL Checkbox_StateValue4
Var /GLOBAL Checkbox_StateValue5
Var /GLOBAL result

Section "MainSection" SEC01
  StrCpy $appname "doctordesk"
SectionEnd

!macro customInstall
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\$appname" "" "Open $appname here"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\$appname" "Icon" "$appExe"
  WriteRegStr HKCU "Software\Classes\Directory\Background\shell\$appname\command" "" `$appExe "%*"`

  WriteRegStr HKCU "Software\Classes\Directory\shell\$appname" "" "Open $appname here"
  WriteRegStr HKCU "Software\Classes\Directory\shell\$appname" "Icon" "$appExe"
  WriteRegStr HKCU "Software\Classes\Directory\shell\$appname\command" "" `$appExe "%*"`

  WriteRegStr HKCU "Software\Classes\Drive\shell\$appname" "" "Open $appname here"
  WriteRegStr HKCU "Software\Classes\Drive\shell\$appname" "Icon" "$appExe"
  WriteRegStr HKCU "Software\Classes\Drive\shell\$appname\command" "" `$appExe "%*"`

  DetailPrint "Register $appname URI Handler"
  DeleteRegKey HKCR "$appname"
  WriteRegStr HKCR "$appname" "" "URL:$appname"
  WriteRegStr HKCR "$appname" "URL Protocol" ""
  WriteRegStr HKCR "$appname\shell" "" ""
  WriteRegStr HKCR "$appname\shell\Open" "" ""
  WriteRegStr HKCR "$appname\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"

!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\$appname"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\$appname"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\$appname"
	DeleteRegKey HKCR "$appname"
  ; ${ifNot} ${isUpdated}
  ;   # 提示窗
  ;     ${If} $Checkbox_State == ${BST_CHECKED}
  ;       # 如果勾选删除固定文件夹（测试版）
  ;       MessageBox MB_OKCANCEL "是否确认删除用户数据?" IDOK label_ok  IDCANCEL  label_cancel
  ;       label_ok:
  ;           # 删除固定文件夹
  ;           RMDir /r $PROFILE\iConfig_TEST
  ;           Goto end
  ;       label_cancel:
  ;           Goto end
  ;       end:
  ;     ${EndIf}
  ; ${endIf}
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInit
  IfFileExists $LOCALAPPDATA\$appname\Update.exe 0 +2
  nsExec::Exec '"$LOCALAPPDATA\$appname\Update.exe" --uninstall -s'
!macroend


# 创建自定义卸载页面
!insertmacro MUI_UNPAGE_WELCOME
UninstPage custom un.nsDialogsPage un.nsDialogsPageLeave
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH
UninstPage custom un.nsDialogsPageFinish

LangString INFO1 ${LANG_ENGLISH} "Prompt message1"
LangString INFO1 ${LANG_SIMPCHINESE} "提示信息1"
LangString INFO2 ${LANG_ENGLISH} " Prompt message 2"
LangString INFO2 ${LANG_SIMPCHINESE} "提示信息2"

Function un.nsDialogsPage
	nsDialogs::Create 1018
	Pop $Dialog_1
	${If} $Dialog_1 == error
		Abort
	${EndIf}
  ; $LANGUAGE
  ${If} $LANGUAGE == 2052
    ${NSD_CreateLabel} 0 10u 100% 12u "卸载原因"
    Pop $Label_1
    ${NSD_CreateLabel} 10u 25u 100% 12u "使用过程中遇到了什么问题吗"
    Pop $Label_2
    ${NSD_CreateHLine} 0 35u 100% 12u "2052"
    Pop $VLine
    ${NSD_CreateCheckbox} 20u 50u 30% 10u "功能复杂、操作麻烦"
    Pop $CheckBox_1
    ${NSD_CreateCheckbox} 120u 50u 30% 10u "软件不稳定、bug多"
    Pop $CheckBox_2
    ${NSD_CreateCheckbox} 220u 50u 30% 10u "不兼容我的设备"
    Pop $CheckBox_3
    ${NSD_CreateCheckbox} 20u 70u 20% 10u "软件闪退"
    Pop $CheckBox_4
    ${NSD_CreateCheckbox} 120u 70u 20% 10u "长期不使用"
    Pop $CheckBox_5
    nsDialogs::Show
	${EndIf}
  ${If} $LANGUAGE == 1033
    ${NSD_CreateVLine} 0 30u 100% 12u "1033"
    Pop $VLine
    ${NSD_CreateLabel} 0 10u 100% 12u "uninstall reason"
    Pop $Label_1
    ${NSD_CreateLabel} 10u 30u 100% 12u "Did you encounter any problems during use?"
    Pop $Label_2
    ${NSD_CreateCheckbox} 0 50u 100% 10u "功能复杂操作麻烦"
    Pop $CheckBox_1
    ${NSD_CreateCheckbox} 0 50u 100% 10u "软件闪退"
    Pop $CheckBox_1
    nsDialogs::Show
	${EndIf}
  ${If} $LANGUAGE == 1041
    ${NSD_CreateVLine} 0 30u 100% 12u "1041"
    Pop $VLine
    ${NSD_CreateLabel} 0 10u 100% 12u "アンインストールの理由"
    Pop $Label_1
    ${NSD_CreateLabel} 10u 30u 100% 12u "使用中に問題が発生しましたか？"
    Pop $Label_2
    ${NSD_CreateCheckbox} 0 50u 100% 10u "功能复杂操作麻烦"
    Pop $CheckBox_1
    ${NSD_CreateCheckbox} 0 50u 100% 10u "软件闪退"
    Pop $CheckBox_1
    nsDialogs::Show
	${EndIf}

FunctionEnd
Function un.nsDialogsPageLeave
   ${NSD_GetState} $CheckBox_1 $Checkbox_State1
   ${NSD_GetState} $CheckBox_2 $Checkbox_State2
   ${NSD_GetState} $CheckBox_3 $Checkbox_State3
   ${NSD_GetState} $CheckBox_4 $Checkbox_State4
   ${NSD_GetState} $CheckBox_5 $Checkbox_State5
   ${If} $Checkbox_State1 == 1
		StrCpy $result "1"
	 ${EndIf}
   ${If} $Checkbox_State1 == 0
		StrCpy $result ""
	 ${EndIf}
   ${If} $Checkbox_State2 == 1
    StrCpy $Checkbox_StateValue2 "2"
		StrCpy $result "$result$Checkbox_StateValue2"
	 ${EndIf}
   ${If} $Checkbox_State3 == 1
   StrCpy $Checkbox_StateValue3 "3"
		StrCpy $result "$result$Checkbox_StateValue3"
	 ${EndIf}
   ${If} $Checkbox_State4 == 1
    StrCpy $Checkbox_StateValue4 "4"
		StrCpy $result "$result$Checkbox_StateValue4"
	 ${EndIf}
   ${If} $Checkbox_State5 == 1
    StrCpy $Checkbox_StateValue5 "5"
		StrCpy $result "$result$Checkbox_StateValue5"
	 ${EndIf}
    ExecWait "$INSTDIR\resources\app\bin\unInstallReason.bat $result"
    ; ExecWait "$INSTDIR\resources\app\bin\unInstallReason.bat $DESKTOP\un.log $result"
    ;  nsExec::Exec "$INSTDIR\resources\app\bin\111.bat $DESKTOP\111.log $result"
	;  MessageBox MB_OK "You checked:$\n$\n   CheckBox_1 $CheckBox_1 $\n$\n  Checkbox_State $Checkbox_State1   $\n$\n  CheckBox_1 $CheckBox_2 $\n$\n  Checkbox_State $Checkbox_State2   $\n$\n CheckBox_1 $CheckBox_3 $\n$\n  Checkbox_State $Checkbox_State3   $\n$\n CheckBox_1 $CheckBox_4 $\n$\n  Checkbox_State $Checkbox_State4   $\n$\n CheckBox_1 $CheckBox_5 $\n$\n  Checkbox_State $Checkbox_State5   $\n$\n  $CheckBox_5 $\n$\n  result $INSTDIR   $result $\n$\n "
FunctionEnd

Function un.nsDialogsPageFinish
  Quit
FunctionEnd

Section
SectionEnd
