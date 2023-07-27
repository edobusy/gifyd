# GIFYD
Web application to create gifs from video files. Customisation options include gif duration, gif framerate, filters, and the possibility to write a caption. Written in TypeScript, HTML, and CSS. File format transformation and video editing was done using ffmpeg, more specifically [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm).

## App Walkthrough
After booting up the application, you will reach the initial view, in which you can see the upload button. Click on it and select the video file you want to extract your GIF from.

![](https://yourimageshare.com/ib/H6a6cJN2yu.webp)

You will now be able to see your video on the left, and some video editing options on the right. By clicking the Edit option, you can change the starting point for your GIF, the framerate, and the GIF length.

![](https://yourimageshare.com/ib/IYgbbROn7F.webp)

The Filter button will open up new options to change your video visually, with a series of pixel manipulation filters.

![](https://yourimageshare.com/ib/MLhyYhygef.webp)

You can also add text to your GIF via the Caption button, there are plenty of configuration options for you to customise your caption, so feel free to play around with it. The app will show you what the caption will look like in real time.

![](https://yourimageshare.com/ib/yj0fryxMeB.webp)

Once you are happy with your creation, press the "GIF it!" button to tell the app that you are done, and the GIF will be created for you. The new view will let you name the GIF file however you want, and by clicking the Download button, you will receive you newly made GIF!

![](https://yourimageshare.com/ib/My95CBs2nj.webp)

And here is the final result!

![](https://media4.giphy.com/media/WpGTp9M9LQFAYR8VQe/giphy.gif)

## Deploy locally
Download the repository, open the command prompt, navigate to the repository folder, then run `npm install` and `npm run dev` to try out the project yourself!
