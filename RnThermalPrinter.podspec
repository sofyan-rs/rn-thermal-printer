require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RnThermalPrinter"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # Uses RN helper 'min_ios_version_supported' from react_native_pods
  s.platforms    = { :ios => min_ios_version_supported }

  s.source       = {
    :git => "https://github.com/sofyan-rs/rn-thermal-printer.git",
    :tag => s.version.to_s
  }

  # Include Swift now
  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"
  s.requires_arc = true
  s.swift_version = "5.0"

  # Needed for NWConnection
  s.frameworks = "Network"

  # React Native core (optional; helpers will also wire deps, but this is safe)
  s.dependency "React-Core"

  # Keep RN’s install macro so New Architecture / Codegen deps are added correctly
  install_modules_dependencies(s)
end