@REM @echo off
@REM :again
@REM set /p web=please input web url: 
@REM set /p method=please input method: 
@REM if %method%==PUT (goto :TransferData) else (if %method%==POST (goto :TransferData) else (curl -v -X %method% -H "Content-Type: text/html; charset=UTF-8" %web%))
@REM goto :again
@REM pause

@REM :TransferData
@REM set /p data=please input data: 
@REM curl -v -X %method% -H "Content-Type: text/html; charset=UTF-8" -d %data% %web%
@REM goto :again

set param1 = %1
set param1 = %2
echo %1
echo %2
@REM pause
@REM echo %1 >%2
@REM curl -v -X "get" -H "Content-Type: text/html; charset=UTF-8" "http://www.baidu.com")