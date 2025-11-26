// File: Heil.tsx

import { Button } from "./components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import "./s.css"

export function Heil() {
  return (
    <Card
      style={{ fontFamily: "Arial, sans-serif" }}
      className="w-full max-w-sm font-sans relative rounded-2xl overflow-hidden" >
      {/* Optional dark overlay */}
      <div className="absolute inset-0  bg-opacity-40 clip-custom z-0" id="one"/>

      {/* Card content on top of overlay */}
      <div className="relative z-10">
        <CardHeader>
          <CardTitle className="text-white">Login to your account</CardTitle>
          <CardDescription >
            Enter your username below to login to your account
          </CardDescription>
          <CardAction>
            <Button variant="link" className=" hover:underline">
              Sign Up
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" >
                  Username
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="bg-black bg-opacity-30 text-white border placeholder-yellow-100"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-opacity-30 text-white border "
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black shadow-md shadow-yellow-500/50"
          >
            Login
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}
