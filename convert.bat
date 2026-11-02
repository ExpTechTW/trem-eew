@echo off

REM cd into records
pushd records

REM Make hidden temp folder
mkdir .temp
attrib +h .temp /s /d

REM Copy files to json
for %%F in (./*.json) do (
  copy "./%%F" "./.temp/%%~nF" > nul
)

REM Zip all files inside .temp
powershell Compress-Archive "./.temp/*" records.zip

REM Remove temp folder
rmdir .temp /s /q

REM Rename zip to trply
move "records.zip" "../records.trply"

echo Done!
pause