import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import mergeImages from 'merge-images';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { ImagePicker } from '@awesome-cordova-plugins/image-picker/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  imageCaptured: any;
  newImage: any;
  captureSize: any;
  frameImg:any = '../../assets/images/frame.png';
  frameSize:any;
  mergeFrame: any;
  finalImage: any;
  newFinalImage: any;
  locationCordinates:any;
  loadingLocation:boolean;
  locationWatchStarted:boolean;
  locationSubscription:any;
  locationTraces = [];

  constructor(private camera: Camera, private geolocation: Geolocation, public file: File, private imagePicker: ImagePicker) {
    this.getLatLong();
  }

  openGallery() {
    let options = {
      maximumImagesCount: 1,
      outputType: 1
  };
    this.imagePicker.getPictures(options).then((results) => {
      console.log(results);
      this.imageCaptured = "data:image/jpeg;base64," + results[0];
      // this.getDimensions(this.imageCaptured).then((res) => {
      //   console.log(res);
      //   this.captureSize = res;
      // });
      this.getDimensions(this.frameImg).then((res) => {
        console.log(res);
        this.frameSize = res;
      });
    }, (err) => { });
  }
  clickCamera() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    
    this.camera.getPicture(options).then((imageData) => {
      console.log(imageData);
      this.imageCaptured = "data:image/jpeg;base64," + imageData;
      // this.getDimensions(this.imageCaptured).then((res) => {
      //   console.log(res);
      //   this.captureSize = res;
      // });
      this.getDimensions(this.frameImg).then((res) => {
        console.log(res);
        this.frameSize = res;
      });
    }, (err) => {
     // Handle error
    });
  }

  getDimensions(file) {
    var width, height;
    return new Promise((resolve) => {
    var img = new Image();
    img.src = file;
    img.addEventListener('load',function(){
        width=img.width;
        height=img.height;
        console.log(width);
        console.log(height);
        resolve({width:width, height: height });
    });
  });
  }

  changeDimensions(file) {
    let c = document.createElement('canvas');
    let me = this;
    var width, height;
    return new Promise((resolve) => {
      var img = new Image();
      img.src = file;
      img.addEventListener('load',function(){
          img.width = me.frameSize.width;
          img.height = me.frameSize.height * 5;
          c.width = img.width;
          c.height = img.height;
          console.log(width);
          console.log(height);
          var ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var base64String = c.toDataURL();
          resolve({ src: base64String, width: img.width, height: img.height});
      });
    });
  }

  saveImageToGallery() {
    this.changeDimensions(this.imageCaptured).then((res: any) => {
      console.log(res);
      this.finalImage = res;
      mergeImages(
        [ 
        {
          src: this.finalImage.src 
        },
        { 
          src:  this.frameImg,
           x : 0, 
           y : this.finalImage.height - this.frameSize.height
        }
        ],
        {
          width: this.finalImage.width,
          height: this.finalImage.height
        })
      .then(b64 => {
        this.newFinalImage = b64;
        this.saveBase64(this.newFinalImage, 'image'+ new Date().getTime()+'.png').then((res) => {
          console.log(res);
        });
      });
    });
   
  }

  b64toBlob(b64Data, contentType) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

saveBase64(base64:string, name:string):Promise<string>{
  return new Promise((resolve, reject)=>{
    var realData = base64.split(",")[1]
    let blob=this.b64toBlob(realData, 'image/png')

    this.file.writeFile(this.file.externalRootDirectory+ '/Download/', name, blob)
    .then(()=>{
      resolve(this.file.externalRootDirectory+ 'Download/'+name);
    })
    .catch((err)=>{
      console.log('error writing blob')
      reject(err)
    })
  })
}
getLatLong() {
  this.loadingLocation = true;
  this.geolocation.getCurrentPosition().then((resp) => {
    console.log(resp);
    this.locationCordinates = resp.coords;
    this.loadingLocation = false;
  }).catch((error) => {
    this.loadingLocation = false;
    console.log('Error getting location', error);
  });
}

getCoordinates() {
  this.geolocation.getCurrentPosition().then((resp) => {

    this.locationTraces.push({
      latitude:resp.coords.latitude,
      longitude:resp.coords.latitude,
      accuracy:resp.coords.accuracy,
      timestamp:resp.timestamp
    });

  }).catch((error) => {
    console.log('Error getting location', error);
  });

  this.locationSubscription = this.geolocation.watchPosition();
  this.locationSubscription.subscribe((resp) => {

    this.locationWatchStarted = true;
    this.locationTraces.push({
      latitude:resp.coords.latitude,
      longitude:resp.coords.latitude,
      accuracy:resp.coords.accuracy,
      timestamp:resp.timestamp
    });

  });
}

}
