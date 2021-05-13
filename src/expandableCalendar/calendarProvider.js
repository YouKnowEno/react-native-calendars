import _ from 'lodash';
import React, {Component} from 'react';
import {Animated, TouchableOpacity, View, Platform, Dimensions} from 'react-native';
import {initialWindowMetrics} from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import XDate from 'xdate';

import dateutils from '../dateutils';
import {xdateToData} from '../interface';
import styleConstructor from './style';
import CalendarContext from './calendarContext';

const commons = require('./commons');
const UPDATE_SOURCES = commons.UPDATE_SOURCES;
// const iconDown = require('../img/down.png');
// const iconUp = require('../img/up.png');

/**
 * @description: Calendar context provider component
 * @example: https://github.com/wix/react-native-calendars/blob/master/example/src/screens/expandableCalendar.js
 */
class CalendarProvider extends Component {
  static displayName = 'CalendarProvider';

  static propTypes = {
    /** Initial date in 'yyyy-MM-dd' format. Default = Date() */
    date: PropTypes.any.isRequired,
    /** Callback for date change event */
    onDateChanged: PropTypes.func,
    /** Callback for month change event */
    onMonthChange: PropTypes.func,
    /** Whether to show the today button */
    showTodayButton: PropTypes.bool,
    /** Today button's top position */
    todayBottomMargin: PropTypes.number,
    /** Today button's style */
    todayButtonStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    /** The opacity for the disabled today button (0-1) */
    disabledOpacity: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);

    this.state = {
      date: this.props.date || XDate().toString('yyyy-MM-dd'),
      updateSource: UPDATE_SOURCES.CALENDAR_INIT,
      disabled: false,
      opacity: new Animated.Value(0),
      backgroundColor: new Animated.Value(0)
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.date !== this.props.date) {
      this.setDate(this.props.date, UPDATE_SOURCES.PROP_UPDATE);
    }
  }

  getProviderContextValue = () => {
    return {
      setDate: this.setDate,
      date: this.state.date,
      updateSource: this.state.updateSource,
      setDisabled: this.setDisabled
    };
  };

  setDate = (date, updateSource) => {
    const sameMonth = dateutils.sameMonth(XDate(date), XDate(this.state.date));

    this.setState({date, updateSource}, () => {
      // this.animateTodayButton(date);
      this.animateOpacity(date);
      this.animateBackgroundColor(date);
    });

    _.invoke(this.props, 'onDateChanged', date, updateSource);

    if (!sameMonth) {
      _.invoke(this.props, 'onMonthChange', xdateToData(XDate(date)), updateSource);
    }
  };

  setDisabled = disabled => {
    if (this.props.showTodayButton && disabled !== this.state.disabled) {
      this.setState({disabled});
      // this.animateOpacity(disabled);
    }
  };

  isPastDate(date) {
    const today = XDate();
    const d = XDate(date);

    if (today.getFullYear() > d.getFullYear()) {
      return true;
    }
    if (today.getFullYear() === d.getFullYear()) {
      if (today.getMonth() > d.getMonth()) {
        return true;
      }
      if (today.getMonth() === d.getMonth()) {
        if (today.getDate() > d.getDate()) {
          return true;
        }
      }
    }
    return false;
  }

  animateOpacity(date) {
    if (this.props.showTodayButton) {
      const today = XDate().toString('yyyy-MM-dd');
      const isToday = today === date;

      Animated.timing(this.state.opacity, {
        toValue: isToday ? 0 : 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }

  animateBackgroundColor(date) {
    if (this.props.showTodayButton) {
      const today = XDate().toString('yyyy-MM-dd');
      const isToday = today === date;

      Animated.timing(this.state.backgroundColor, {
        toValue: isToday ? 0 : 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }

  onTodayPress = () => {
    const today = XDate().toString('yyyy-MM-dd');
    this.setDate(today, UPDATE_SOURCES.TODAY_PRESS);
  };

  renderTodayButton() {
    const {opacity} = this.state;
    const top = Platform.select({
      android: '2.5%',
      ios: initialWindowMetrics.insets.top + Dimensions.get('window').height * 0.02
    });
    return (
      <Animated.View style={[this.style.todayButtonContainer, {opacity, top}]}>
        <TouchableOpacity
          style={
            ([this.style.todayButton, this.props.todayButtonStyle],
            {
              backgroundColor: '#DDDCD9',
              borderRadius: 14,
              height: 28,
              paddingHorizontal: 10,
              justifyContent: 'center',
              alignItems: 'center'
            })
          }
          onPress={this.onTodayPress}
        >
          <Animated.Text allowFontScaling={false} style={[this.style.todayButtonText]}>
            TODAY
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  render() {
    return (
      <CalendarContext.Provider value={this.getProviderContextValue()}>
        <View style={[{flex: 1}, this.props.style]}>{this.props.children}</View>
        {this.props.showTodayButton && this.renderTodayButton()}
      </CalendarContext.Provider>
    );
  }
}

export default CalendarProvider;
