# CoC Bot: Electric Boogaloo
A bot for connecting Twitch with Clash of Code (CoC)

## Commands
& is assumed as a prefix here, <argument> are arguments
@<bot name> prefix <new prefix> - If admin: sets the prefix, otherwise displays the current prefix.
&link - Displays the current CoC link, if one was created.
&new <modes... languages...> - If admin: creates a new clash, using all arguments to try to find the modes and languages, otherwise functions the same as &link.
&start - If admin: starts the current clash created with &new, otherwise functions the same as &link.
&eval <cmd...> - If admin: evaluates the command given, otherwise sends `I do not give you consent to use that command...mate...that'd too dangerous...`.

## Configuration
The code loads the configuration from config.json - An example config can be found in config.json.example; a description of the fields can be found in config.json.default (or by looking at the code...)

## Example usage
```
@bot prefix -->
-->new reverse javascript
-->link
-->start
```

## Questions / bugs?
Contact ||rozbrajaczpoziomow||#5650 on Discord with any suggestions, questions, bugs, or just smalltalk.. :)