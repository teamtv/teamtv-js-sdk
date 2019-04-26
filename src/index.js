class EventStream
{
  constructor(endpointUrl)
  {
    this.eventSource = new EventSource(endpointUrl);
    this.eventSource.addEventListener("Shot", this._wrapEventHandler(this.onShot.bind(this)));
    this.eventSource.addEventListener("StartPossession", this._wrapEventHandler(this._onStartPossession.bind(this)));
    this.eventSource.addEventListener("BallLoss", this._wrapEventHandler(this.onBallLoss.bind(this)));
    this.eventSource.addEventListener("Substitution", this._wrapEventHandler(this.onSubstitution.bind(this)));
    this.eventSource.addEventListener("GoalCorrection", this._wrapEventHandler(this.onGoalCorrection.bind(this)));
    this.eventSource.addEventListener("PenaltyGiven", this._wrapEventHandler(this.onPenaltyGiven.bind(this)));
    this.eventSource.addEventListener("EndPeriod", this._wrapEventHandler(this.onEndPeriod.bind(this)));
    this.eventSource.addEventListener("StartPeriod", this._wrapEventHandler(this.onStartPeriod.bind(this)));


    this.currentState = {
      possession: null,
      period: null
    };

    this._eventHandlers = {};
  }

  relativeTime(time)
  {
    return {
      time: time - this.currentState.period.time,
      period: this.currentState.period.period
    }
  }

  on(eventName, callback)
  {
    if (typeof this._eventHandlers[eventName] === "undefined")
    {
      this._eventHandlers[eventName] = [];
    }
    this._eventHandlers[eventName].push(callback);
  }

  _trigger(eventName, attributes)
  {
    if (typeof this._eventHandlers[eventName] !== "undefined")
    {
      for(const callback of this._eventHandlers[eventName])
      {
        callback(attributes);
      }
    }
  }

  _wrapEventHandler(fn)
  {
    return ({data}) => {
      const {eventAttributes, description, occurredOn} = JSON.parse(data);
      fn(eventAttributes, description, occurredOn);
    };
  }

  _endPossession(nextPossessionStartTime)
  {
    if (this.currentState.possession !== null)
    {
      this._trigger(
        "endPossession",
        {
          endTime: this.relativeTime(nextPossessionStartTime - 0.0001),
          ...this.currentState.possession
        }
      )
    }
  }

  _onStartPossession({id, time, startPossessionAttributes: attributes})
  {
    this._endPossession(time);

    this.currentState.possession = {
      startTime: this.relativeTime(time),
      id,
      ...attributes
    };

    this._trigger(
      "startPossession",
      this.currentState.possession
    );
  }


  onShot({time, id, shotAttributes: attributes, description})
  {
    this._trigger(
      "shot",
      {
        time: this.relativeTime(time),
        id, description,
        ...attributes,
        possession: this.currentState.possession
      }
    );
  }

  onBallLoss({time, id, ballLossAttributes: attributes, description})
  {
    this._trigger(
      "ballLoss",
      {
        time: this.relativeTime(time),
        id, description,
        ...attributes,
        possession: this.currentState.possession
      }
    );
  }

  onSubstitution({time, id, substitutionAttributes: attributes, description})
  {
    this._trigger(
      "substitution",
      {
        time: this.relativeTime(time),
        id, description,
        ...attributes,
        possession: this.currentState.possession
      }
    );
  }

  onPenaltyGiven({time, id, penaltyGivenAttributes: attributes, description})
  {
    this._trigger(
      "penaltyGiven",
      {
        time: this.relativeTime(time),
        id, description,
        ...attributes,
        possession: this.currentState.possession
      }
    );
  }

  onGoalCorrection({time, id, goalCorrectionAttributes: attributes, description})
  {
    this._trigger(
      "goalCorrection",
      {
        time: this.relativeTime(time),
        id, description,
        ...attributes,
        possession: this.currentState.possession
      }
    );
  }

  onEndPeriod({clockId, time, period})
  {
    this._endPossession();

    this._trigger(
      "endPeriod",
      {
        period
      }
    )
  }

  onStartPeriod({clockId, time, period})
  {
    this.currentState.period = {
      time: time,
      period
    };

    this._trigger(
      "startPeriod",
      {
        period
      }
    )
  }
}

// export { EventStream };