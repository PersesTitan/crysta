"use strict";


JSIL.DeclareNamespace("JSIL.Shell", false);


JSIL.Shell.StdOutService = function () {
};

JSIL.Shell.StdOutService.prototype.write = function (text) {
  putstr(text);
};


JSIL.Shell.StdErrService = function () {
};

JSIL.Shell.StdErrService.prototype.write = function (text) {
  var trimmed = String(text).trim();
  if (trimmed[trimmed.length - 1] === "\n") {
    text = trimmed.substr(0, trimmed.length - 1);
  }

  printErr(text);
};


JSIL.Shell.RunLaterService = function () {
  this.queue = [];
};

JSIL.Shell.RunLaterService.prototype.enqueue = function (callback) {
  this.queue.push(callback);
};

JSIL.Shell.RunLaterService.prototype.flush = function () {
  while (this.queue.length > 0) {
    var count = this.queue.length;

    for (var i = 0; i < count; i++) {
      var item = this.queue[i];
      item();
    }

    this.queue.splice(0, count);
  }
};


(function () {
  JSIL.Host.registerServices({
    stdout:   new JSIL.Shell.StdOutService(),
    stderr:   new JSIL.Shell.StdErrService(),
    runLater: new JSIL.Shell.RunLaterService()
  });
})();


function reportException (e) {
  var stack = "";
  try {
    stack = e.stack || "";
  } catch (ex) {
    stack = "";
  }

  JSIL.Host.logWriteLine("// EXCEPTION:");
  JSIL.Host.logWriteLine(String(e));
  if (stack.length > 0) {
    JSIL.Host.logWriteLine("// STACK:");
    JSIL.Host.logWriteLine(stack);
  }
  JSIL.Host.logWriteLine("// ENDEXCEPTION");

  throw e;
};

function loadAssets (assets) {
  for (var i = 0, l = assets.length; i < l; i++) {
    var assetSpec = assets[i];
  
    var assetType = assetSpec[0];
    var assetPath = assetSpec[1];
    var assetData = assetSpec[2] || null;

    var assetLoader = assetLoaders[assetType];

    assetLoader(assetPath, assetData);
  }
}

var $$ObjectToTag = null;
JSIL.Shell.TaggedObjectCount = 0;

JSIL.Shell.TagObject = function (obj, tag) {
  if (typeof (evaluate) === "function") {
    var index = JSIL.Shell.TaggedObjectCount++;
    var objectId = "TAGGED_OBJECT_" + index;
    $$ObjectToTag = obj;
    $$ObjectToTag = null;

    printErr("// " + objectId + "='" + tag + "'");
  }
};

JSIL.Shell.TestPrologue = function (timeoutDuration, assemblyName, typeName, methodName, args, throwOnUnimplementedExternals) {
  return function runTestCase (dateNow) {
    JSIL.ThrowOnUnimplementedExternals = throwOnUnimplementedExternals;

    timeout(timeoutDuration);

    var started = dateNow();

    var testAssembly = JSIL.GetAssembly(assemblyName, true);

    if (!testAssembly)
      throw new Error("No assembly named '" + assemblyName + "'");

    var parsedTypeName = JSIL.ParseTypeName(typeName);    
    var testType = JSIL.GetTypeInternal(parsedTypeName, testAssembly, true);
    var testTypePublicInterface = testType.__PublicInterface__;

    var testMethod = testTypePublicInterface[methodName];

    if (!testMethod)
      throw new Error("No method named '" + methodName + "'");

    testMethod.call(testTypePublicInterface, args);
    
    var ended = dateNow();
    return (ended - started);
  };
};