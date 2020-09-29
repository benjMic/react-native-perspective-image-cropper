import React, { Component } from "react";
import {
  NativeModules,
  PanResponder,
  Dimensions,
  Platform,
  Image,
  View,
  Text,
  Animated,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

class CustomCrop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewHeight: Dimensions.get("window").width * (props.height / props.width),
      height: props.height,
      width: props.width,
      image: props.initialImage,
      moving: false,
      lockPan: true,
    };

    this.state = {
      ...this.state,
      topLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topLeft,
              true
            )
          : { x: 100, y: 100 }
      ),
      topRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topRight,
              true
            )
          : { x: Dimensions.get("window").width - 100, y: 100 }
      ),
      bottomLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomLeft,
              true
            )
          : { x: 100, y: this.state.viewHeight - 100 }
      ),
      bottomRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomRight,
              true
            )
          : {
              x: Dimensions.get("window").width - 100,
              y: this.state.viewHeight - 100,
            }
      ),
    };
    this.state = {
      ...this.state,
      overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value} ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value},${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value},${this.state.bottomLeft.y._value}`,
    };

    this.panResponderTopLeft = this.createPanResponser(this.state.topLeft);
    this.panResponderTopRight = this.createPanResponser(this.state.topRight);
    this.panResponderBottomLeft = this.createPanResponser(
      this.state.bottomLeft
    );
    this.panResponderBottomRight = this.createPanResponser(
      this.state.bottomRight
    );
  }

  componentDidUpdate(prevProps, props) {
    console.log("prevProps.initialImage", prevProps.initialImage);
    console.log("props.initialImage", props.initialImage);

    if (
      this.props.initialImage &&
      prevProps.initialImage !== this.props.initialImage
    )
      this.setState({
        viewHeight:
          Dimensions.get("window").width *
          (this.props.height / this.props.width),
        height: this.props.height,
        width: this.props.width,
        image: this.props.initialImage,
        moving: false,
        lockPan: true,
      });
  }

  createPanResponser(corner) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // this.setState({ lockPan: false })

        return true;
      },
      onPanResponderMove: (evt, gestureState) => {
        // if(topLeftx < topRightx)
        console.log(
          gestureState.moveX,
          gestureState.moveY,
          this.state.viewHeight,
          Dimensions.get("window").width
        );

        // if (gestureState.moveX + 5 < Dimensions.get('window').width &&
        //   gestureState.moveX > 5 &&
        //   gestureState.moveY < this.state.viewHeight + 80
        // && gestureState.moveY > 5)
        Animated.event(
          [
            null,
            {
              dx: corner.x,
              dy: corner.y,
            },
          ],
          { useNativeDriver: false }
        )(evt, gestureState);
        this.updateOverlayString();
      },
      onPanResponderRelease: () => {
        corner.flattenOffset();
        this.updateOverlayString();
      },
      onPanResponderGrant: () => {
        corner.setOffset({ x: corner.x._value, y: corner.y._value });
        corner.setValue({ x: 0, y: 0 });
      },
    });
  }

  crop() {
    const coordinates = {
      topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
      topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
      bottomLeft: this.viewCoordinatesToImageCoordinates(this.state.bottomLeft),
      bottomRight: this.viewCoordinatesToImageCoordinates(
        this.state.bottomRight
      ),
      height: this.state.height,
      width: this.state.width,
    };
    NativeModules.CustomCropManager.crop(
      coordinates,
      this.state.image,
      (err, res) => this.props.updateImage(res.image, coordinates)
    );
  }

  updateOverlayString() {
    let topLeftx = this.state.topLeft.x._value + this.state.topLeft.x._offset;
    let topLefty = this.state.topLeft.y._value + this.state.topLeft.y._offset;

    let topRightx =
      this.state.topRight.x._value + this.state.topRight.x._offset;
    let topRighty =
      this.state.topRight.y._value + this.state.topRight.y._offset;

    let bottomRightx =
      this.state.bottomRight.x._value + this.state.bottomRight.x._offset;
    let bottomRighty =
      this.state.bottomRight.y._value + this.state.bottomRight.y._offset;

    let bottomLeftx =
      this.state.bottomLeft.x._value + this.state.bottomLeft.x._offset;
    let bottomLefty =
      this.state.bottomLeft.y._value + this.state.bottomLeft.y._offset;

    if (topLeftx < topRightx)
      this.setState({
        overlayPositions: `${topLeftx},${topLefty} ${topRightx},${topRighty} ${bottomRightx},${bottomRighty} ${bottomLeftx},${bottomLefty}`,
      });
  }

  imageCoordinatesToViewCoordinates(corner) {
    return {
      x: (corner.x * Dimensions.get("window").width) / this.state.width,
      y: (corner.y * this.state.viewHeight) / this.state.height,
    };
  }

  viewCoordinatesToImageCoordinates(corner) {
    return {
      x: (corner.x._value / Dimensions.get("window").width) * this.state.width,
      y: (corner.y._value / this.state.viewHeight) * this.state.height,
    };
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={[
            s(this.props).cropContainer,
            { height: this.state.viewHeight },
          ]}
        >
          <Image
            style={{ flex: 1 }}
            resizeMode="contain"
            source={{ uri: this.props.initialImage }}
          />
          <Svg
            height={this.state.viewHeight}
            width={Dimensions.get("window").width}
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <AnimatedPolygon
              ref={(ref) => (this.polygon = ref)}
              fill={this.props.overlayColor || "blue"}
              fillOpacity={this.props.overlayOpacity || 0.5}
              stroke={this.props.overlayStrokeColor || "blue"}
              points={this.state.overlayPositions}
              strokeWidth={this.props.overlayStrokeWidth || 3}
            />
          </Svg>
          <Animated.View
            {...this.panResponderTopLeft.panHandlers}
            style={[this.state.topLeft.getLayout(), s(this.props).handler]}
          >
            <View
              style={{
                height: 60,
                width: 60,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={[s(this.props).handlerI]} />
            </View>
          </Animated.View>
          <Animated.View
            {...this.panResponderTopRight.panHandlers}
            style={[this.state.topRight.getLayout(), s(this.props).handler]}
          >
            <View
              style={{
                height: 60,
                width: 60,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={[s(this.props).handlerI]} />
            </View>
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomLeft.panHandlers}
            style={[this.state.bottomLeft.getLayout(), s(this.props).handler]}
          >
            <View
              style={{
                height: 60,
                width: 60,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={[s(this.props).handlerI]} />
            </View>
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomRight.panHandlers}
            style={[this.state.bottomRight.getLayout(), s(this.props).handler]}
          >
            <View
              style={{
                height: 60,
                width: 60,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={[s(this.props).handlerI]} />
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }
}

const s = (props) => ({
  handlerI: {
    borderRadius: 40,
    height: 20,
    width: 20,
    margin: 100,
    backgroundColor: props.handlerColor || "blue",
  },
  image: {
    width: Dimensions.get("window").width,
    position: "absolute",
  },
  bottomButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "blue",
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  handler: {
    height: 140,
    width: 140,
    overflow: "visible",
    marginLeft: -70,
    marginTop: -70,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  cropContainer: {
    width: Dimensions.get("window").width,
  },
});

export default CustomCrop;
