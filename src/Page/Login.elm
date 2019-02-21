port module Page.Login exposing (main)

import Browser
import Html exposing (Html, header, section, h1, ul, li, form, fieldset, legend, label, input, button, div, text, img, p, a, br)
import Html.Attributes exposing (id, src, href, class, type_, value, placeholder, disabled, required)
import Html.Events exposing (onClick, onSubmit, onInput)
import Page.Template as Template

port signOut : () -> Cmd msg
port userUpdated : (User -> msg) -> Sub msg
port signedOut : (() -> msg) -> Sub msg
port invalidSignUp : (String -> msg) -> Sub msg
port invalidSignIn : (String -> msg) -> Sub msg
port signUp : Account -> Cmd msg
port signIn : Login -> Cmd msg

type alias User = { displayName : Maybe String, uid : String }
type alias Account = { displayName : String, email : String, password : String }
type alias Login = { email : String, password : String }

type SigningInOrUp = SigningIn | SigningUp

type alias Model =
    { user : Maybe User
    , from : String
    , signingInOrUp : SigningInOrUp
    , error : Maybe String
    , name : String
    , email : String
    , password : String
    , passwordConfirmation : String
    , valid : Bool
    }

type Msg
    = UserUpdated User
    | SignedOut
    | InvalidSignUp String
    | InvalidSignIn String
    | SignUpClicked
    | SignInClicked
    | SignUp
    | SignIn
    | SignOut
    | InputName String
    | InputEmail String
    | InputPassword String
    | InputPasswordConfirmation String

main : Program String Model Msg
main =
    Browser.document
        { init = \from -> (Model Nothing from SigningUp Nothing "SAM" "scott@sup.ai" "abcdef" "abcdef" True, Cmd.none)
        , view = view
        , update = update
        , subscriptions = subscriptions
        }

view : Model -> Browser.Document Msg
view model =
    case model.user of
        Just user -> viewWithUser model user
        Nothing -> case model.signingInOrUp of
            SigningIn -> viewSigningIn model
            SigningUp -> viewSigningUp model

errorHtml : Maybe String -> Html Msg
errorHtml maybeError =
    case maybeError of
        Nothing -> br [] []
        Just error -> p [ class "error" ] [ text error ]

viewInput : String -> String -> String -> String -> (String -> Msg) -> Html Msg
viewInput inputType inputId inputPlaceholder inputValue inputMsg =
    input [ type_ inputType, id inputId, placeholder inputPlaceholder, required True, value inputValue, onInput inputMsg ] []

viewSigningIn : Model -> Browser.Document Msg
viewSigningIn model =
    { title = "Login - memorize.ai"
    , body =
        [ section [ class "section" ]
            [ div [ class "container" ]
                [ Template.viewHeader model.user SignOut
                , h1 [] [ text "Sign in" ]
                , errorHtml model.error
                , form [ onSubmit SignIn ]
                    [ fieldset []
                        [ legend [] [ text "Enter email and password" ]
                        , viewInput "email" "email" "Email address" model.email InputEmail
                        , viewInput "password" "password" "Password" model.password InputPassword
                        , button [ disabled (not model.valid) ] [ text "Login" ]
                        ]
                    ]
                , a [ onClick SignUpClicked, href "#" ] [ text "Sign up instead" ]
                ]
            ]
        ]
    }

validate : Model -> Model
validate model =
    case model.signingInOrUp of
        SigningIn -> model
        SigningUp -> validateSignUp model

validateSignUp : Model -> Model
validateSignUp model =
    { model | valid
        = model.password == model.passwordConfirmation
        && String.length model.password >= 6
    }

viewSigningUp : Model -> Browser.Document Msg
viewSigningUp model =
    { title = "Login - memorize.ai"
    , body =
        [ section [ class "section" ]
            [ div [ class "container" ]
                [ Template.viewHeader model.user SignOut
                , h1 [ class "title" ] [ text "Sign up" ]
                , errorHtml model.error
                , form [ onSubmit SignUp ]
                    [ fieldset []
                        [ legend [] [ text "Enter account information" ]
                        , viewInput "text" "name" "Name" model.name InputName
                        , viewInput "email" "email" "Email address" model.email InputEmail
                        , viewInput "password" "password" "Password" model.password InputPassword
                        , viewInput "password" "password_again" "Password again" model.passwordConfirmation InputPasswordConfirmation
                        , button [ disabled (not model.valid) ] [ text "Create account" ]
                        ]
                    ]
                , a [ onClick SignInClicked, href "#" ] [ text "Sign in instead" ]
                ]
            ]
        ]
    }

viewWithUser : Model -> User -> Browser.Document Msg
viewWithUser model user =
    { title = "Logged in as " ++ (Maybe.withDefault "unknown" user.displayName) ++ " - memorize.ai"
    , body =
        [ section [ class "section" ]
            [ div [ class "container" ]
                [ Template.viewHeader model.user SignOut
                , h1 [ class "title" ] [ text "Logged In" ]
                , p []
                    [ text "You're already logged in, want to go to your "
                    , a [ href "/dashboard.html" ] [ text "dashboard" ]
                    , text "?"
                    ]
                ]
            ]
        ]
    }

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UserUpdated user ->
            ( { model | user = Just user }, Cmd.none )
        SignedOut ->
            ( { model | user = Nothing }, Cmd.none )
        InvalidSignUp message ->
            ( { model | error = Just message }, Cmd.none )
        InvalidSignIn message ->
            ( { model | error = Just message }, Cmd.none )
        SignUpClicked ->
            ( validate { model | signingInOrUp = SigningUp }, Cmd.none )
        SignInClicked ->
            ( validate { model | signingInOrUp = SigningIn }, Cmd.none )
        SignUp ->
            ( model, signUp ( Account model.name model.email model.password ) )
        SignIn ->
            ( model, signIn ( Login model.email model.password ) )
        SignOut ->
            ( model, signOut () )
        InputName name ->
            ( validate { model | name = name }, Cmd.none )
        InputEmail email ->
            ( validate { model | email = email }, Cmd.none )
        InputPassword password ->
            ( validate { model | password = password }, Cmd.none )
        InputPasswordConfirmation passwordConfirmation ->
            ( validate { model | passwordConfirmation = passwordConfirmation }, Cmd.none )
            
subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ userUpdated UserUpdated
        , signedOut (always SignedOut)
        , invalidSignUp InvalidSignUp
        , invalidSignIn InvalidSignIn
        ]
