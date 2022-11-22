// import SPECTOR from './spector'
import { ClickedPoints, ColoredPoint, DrawRectangle, HelloCanvas, HelloPoint1, HelloPoint2 } from "../ch02"
import {
  HelloQuad, HelloQuad_FAN, HelloTriangle,
  HelloTriangle_LINES, HelloTriangle_LINE_LOOP,
  HelloTriangle_LINE_STRIP, MultiPoint, RotatedTriangle,
  RotatedTriangle_Matrix, ScaledTriangle_Matrix, TranslatedTriangle

} from '../ch03'
import {
  RotatedTranslatedTriangle, RotatedTriangle_Matrix4, RotatingTranslatedTriangle,
  RotatingTriangle, RotatingTriangle_withButtons, TranslatedRotatedTriangle
} from '../ch04'
import {
  ColoredTriangle, HelloTriangle_FragCoord,
  MultiAttributeColor, MultiAttributeSize,
  MultiAttributeSize_Interleaved, MultiTexture,
  TexturedQuad, TexturedQuad_Clamp_Mirror, TexturedQuad_Repeat
} from '../ch05'
import {
  ColoredCube, ColoredCube_singleColor,
  DepthBuffer, HelloCube, HelloCube_singleColor,
  LookAtRotatedTriangles, LookAtRotatedTriangles_mvMatrix, LookAtTriangles,
  LookAtTrianglesWithKeys, LookAtTrianglesWithKeys_ViewVolume, OrthoView,
  OrthoView_halfSize, OrthoView_halfWidth, PerspectiveView, PerspectiveView_mvp,
  PerspectiveView_mvpMatrix, Zfighting
} from '../ch07'
import {
  LightedCube, LightedCube_ambient,
  LightedCube_animation, LightedCube_perFragment, LightedTranslatedRotatedCube,
  LightSource,
  PointLightedCube, PointLightedCube_animation, PointLightedCube_perFragment,
  PointLightedSphere, PointLightedSphere_perFragment
} from '../ch08'
import { JointModel, MultiJointModel, MultiJointModel_segment } from '../ch09'
import {
  ThreeDoverWeb, BlendedCube, Fog,
  Fog_w, FramebufferObject, HUD, LookAtBlendedTriangles,
  OBJViewer, PickFace, PickObject, Picking,
  ProgramObject, RotateObject, RotatingTriangle_contextLost,
  RoundedPoints, Shadow, Shadow_highp, Shadow_highp_sphere, BlendedCubeTwgl, BlendedRectTwgl
} from '../ch10'
import { CoordinateSystem } from '../Appendix'

import {
  LOGLHelloTriangle,
  LOGLHelloRectangle,
  LOGLTexturesTriangle,
  LOGLTexturesWoodBox,
  LOGLCoodSysFirst,
  LOGLCoodSysDraw,
  LOGLTexturesWoodBox3D,
  LOGLTextures10WoodBox3D,

  LOGLLightScene,

  LOGLMaterial,

  LOGLLightingMapping,
  LOGLDiffuseMapping,

  LOGLCameraPosition,
  LOGLCameraRotate,
  LOGLCameraMoving,
  LOGLAxis,
  LOGLGrid,
  LOGLGridTWGLV,
  LOGLAxisTWGLV,
  LOGLTexturesTriangleTWGLV,
  LOGLTexturesWoodBoxTwgl,
  LOGLTexturesWoodBox3DTwgl,
  LOGLTextures10WoodBox3DTwgl,
  LOGLCameraPositionTwgl,
  LOGLCameraMovingTwgl,
} from '../learnopengl'
import { LOGLAmbient, LOGLDiffuse, LOGLSpecular } from '../learnopengl/BasicLighting'
import { LOGLSpecularMaps } from '../learnopengl/LightMapping'
import { LOGLDirectionLight, LOGLPointLight, LOGLSpotLight } from '../learnopengl/LightCasters'
import { LOGLCubuInSkyBox, LOGLSkyBox } from '../learnopengl/SkyBox'
import { LOGLTexLetter, LOGLTexLetter2, LOGLTexRingWithLetter } from '../learnopengl/textures'
import { LOGLCircle, LOGLPick, LOGLPickComplete, LOGLPickCube, LOGLPickCubeRing, LOGLPickCubeRingTex, LOGLPickV2 } from "../learnopengl/Pick"
import { TWGLPrimitive, TWGLTexRing } from "../learnopengl/TWGLAPI"
import { TWGLBlendedPlane, TWGLBlendedPlane2, Primitives, MRT } from "../TWGLeg"
import {TWGLOIT} from '../OIT'
import {TWGLOITDDP, TWGLOITPlane} from '../OITDualDepthPeeling'
import {Defer} from '../Deffer'
import {TextureLab} from '../TextureLab'

import * as SPECTOR from "spectorjs"
window.SPECTOR = SPECTOR


const initSpector = (callback = () => {
  //
}) => {

  window.onload = () => {

    if (window.SPECTOR !== undefined) {
      const spector = new SPECTOR.Spector();
      window.spector = spector
      console.log(' ---- spector ', spector);
      spector.spyCanvas();
      // document.getElementById('spector').addEventListener('click', () => {
      //   console.log(' display ui ');
      //   spector.displayUI()
      // })
      // document.getElementById('start').addEventListener('click', () => {
      //   const canvasDom = document.getElementById('webgl')
      //   const commandCount = 150
      //   // spector.captureCanvas(canvasDom)
      //   spector.startCapture(canvasDom, 50)
      // })
      if (!spector.resultView) {
        spector.getResultUI();
        spector.onCapture.add((capture) => {
          capture.commands = capture.commands.filter(command => command.name !== 'getError')
          console.log(' ---- capture result ', capture);
          spector.resultView.display();
          spector.resultView.addCapture(capture);
        });
      }
    }

    callback()
  }
}


let ExampleFn
// ExampleFn = LOGLPickComplete
// ExampleFn = BlendedCube
// ExampleFn = BlendedCubeTwgl
// ExampleFn = BlendedRectTwgl
// ExampleFn = TWGLTexRing
// ExampleFn = TWGLBlendedPlane2
// ExampleFn = TWGLBlendedPlane
// ExampleFn = FramebufferObject
// ExampleFn = Primitives
ExampleFn = Defer
// ExampleFn = MRT
// ExampleFn = TWGLOIT
// ExampleFn = TWGLOITDDP
// ExampleFn = TWGLOITPlane
// ExampleFn = TextureLab


// const ExampleFn = LOGLTexturesTriangle
initSpector(ExampleFn)

